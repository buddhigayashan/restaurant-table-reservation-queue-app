/* global __dirname */
// Run: node --test tests/vimandya-services.test.cjs
// Tests execute the real TypeScript services against an in-memory Firestore mock.
// No Firebase connection, credentials or real data writes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

function harness(initial = {}, uid = 'customer') {
  const records = structuredClone(initial);
  const auth = { currentUser: uid ? { uid, email: `${uid}@example.com` } : null };
  const cache = {};
  let sequence = 0;
  const ref = (name, id) => ({ id, path: `${name}/${id}` });
  const snap = reference => ({ id: reference.id, ref: reference, exists: () => records[reference.path] !== undefined, data: () => records[reference.path] });
  const matches = q => Object.keys(records).filter(key => key.startsWith(`${q.name}/`) && (!q.filter || (q.filter.op === 'in' ? q.filter.value.includes(records[key][q.filter.field]) : records[key][q.filter.field] === q.filter.value))).map(key => snap(ref(q.name, key.split('/')[1])));
  const firebase = {
    collection: (_, name) => name,
    doc: (first, name, id) => typeof first === 'string' ? ref(first, `generated-${++sequence}`) : ref(name, id),
    query: (name, filter) => ({ name, filter }),
    where: (field, op, value) => ({ field, op, value }),
    getDoc: async reference => snap(reference),
    getDocs: async q => { const docs = matches(q); return { docs, size: docs.length }; },
    serverTimestamp: () => 'server-time',
    runTransaction: async (_, action) => {
      const writes = [];
      const result = await action({ get: async reference => snap(reference),
        set: (reference, data, options) => writes.push(() => { records[reference.path] = options?.merge ? { ...records[reference.path], ...data } : data; }),
        update: (reference, data) => writes.push(() => { records[reference.path] = { ...records[reference.path], ...data }; }),
      });
      writes.forEach(write => write());
      return result;
    },
    onSnapshot: (q, next) => { const docs = matches(typeof q === 'string' ? { name: q } : q); next({ docs, size: docs.length }); return () => {}; },
  };
  const authentication = {
    signInWithEmailAndPassword: async (_, email) => { const id = email.split('@')[0]; auth.currentUser = { uid: id, email }; },
    signOut: async () => { auth.currentUser = null; },
    sendPasswordResetEmail: async () => {},
  };
  function load(relative) {
    const filename = path.resolve(__dirname, '..', relative);
    if (cache[filename]) return cache[filename].exports;
    const module = { exports: {} }; cache[filename] = module;
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })(name => {
      if (name === 'firebase/firestore') return firebase;
      if (name === 'firebase/auth') return authentication;
      if (name === '@/config/firebase') return { auth, db: {} };
      if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
      throw new Error(`Unexpected import ${name}`);
    }, module, module.exports);
    return module.exports;
  }
  return { records, auth, load };
}
const customer = { role: 'customer', fullName: 'Customer' };
const queueInput = { customerName: 'Queue Customer', phoneNumber: '+94771234567', partySize: 4, seatingPreference: 'Indoor', acknowledged: true };
const reservation = { customerId: 'customer', customerName: 'Customer', customerEmail: 'customer@example.com', date: '2099-10-12', time: '18:30', partySize: 2, seatingPreference: 'Indoor', specialRequest: '', status: 'confirmed', createdAt: 'original-time', tableNumber: 'T1' };
const manager = { uid: 'manager', fullName: 'Manager', email: 'manager@example.com', role: 'manager', isActive: true };

test('join requires valid fields, customer access, and prevents active duplicates', async () => {
  const h = harness({ 'users/customer': customer });
  const queue = h.load('src/services/queue/customer.ts');
  await assert.rejects(queue.joinCustomerQueue({ ...queueInput, partySize: 0 }), /party size/);
  await assert.rejects(queue.joinCustomerQueue({ ...queueInput, acknowledged: false }), /Confirm/);
  const id = await queue.joinCustomerQueue(queueInput);
  assert.equal(h.records[`queueEntries/${id}`].status, 'waiting');
  assert.equal(h.records[`queueEntries/${id}`].position, 1);
  assert.equal(h.records[`queueEntries/${id}`].estimatedWaitMinutes, 5);
  await assert.rejects(queue.joinCustomerQueue(queueInput), /already have/);
  h.auth.currentUser = null;
  await assert.rejects(queue.joinCustomerQueue(queueInput), /sign in/);
});
test('queue order includes operational entries and preserves cancelled history', async () => {
  const h = harness({ 'users/customer': customer, 'queueEntries/walk-in': { customerId: 'other', position: 1, status: 'waiting' } });
  const queue = h.load('src/services/queue/customer.ts');
  const id = await queue.joinCustomerQueue(queueInput);
  assert.equal(h.records[`queueEntries/${id}`].position, 2);
  await assert.rejects(queue.leaveCustomerQueue('walk-in'), /does not belong/);
  await queue.leaveCustomerQueue(id);
  assert.equal(h.records[`queueEntries/${id}`].status, 'cancelled');
  const next = await queue.joinCustomerQueue(queueInput);
  assert.notEqual(next, id);
  assert.equal(h.records[`queueEntries/${id}`].status, 'cancelled');
  assert.equal(h.records['queueEntries/walk-in'].status, 'waiting');
});
test('queue called notice is idempotent and notification ownership is enforced', async () => {
  const h = harness({ 'users/customer': customer, 'queueEntries/q1': { customerId: 'customer', status: 'called' }, 'customerNotifications/other': { customerId: 'other', read: false } });
  const service = h.load('src/services/notifications/customer.ts');
  await service.ensureQueueStatusNotice('q1');
  await service.markNoticesRead(['q1-called']);
  await service.ensureQueueStatusNotice('q1');
  assert.equal(h.records['customerNotifications/q1-called'].read, true);
  assert.equal(h.records['customerNotifications/q1-called'].type, 'table_ready');
  await assert.rejects(service.markNoticesRead(['other']), /does not belong/);
});
test('booking updates preserve ownership, createdAt and optional table fields', async () => {
  const h = harness({ 'users/customer': customer, 'reservations/r1': reservation });
  await h.load('src/services/reservations/customer.ts').changeCustomerBooking('r1', { date: '2099-10-12', time: '19:00', partySize: 4, seatingPreference: 'Indoor', specialRequest: 'Birthday' });
  assert.equal(h.records['reservations/r1'].time, '19:00');
  assert.equal(h.records['reservations/r1'].customerId, 'customer');
  assert.equal(h.records['reservations/r1'].createdAt, 'original-time');
  assert.equal(h.records['reservations/r1'].tableNumber, 'T1');
  assert.equal(Object.keys(h.records).filter(key => key.startsWith('customerNotifications/')).length, 1);
  assert.equal(Object.keys(h.records).filter(key => key.startsWith('kitchenAlerts/')).length, 1);
});
test('booking ownership and future-state guards reject unsafe changes', async () => {
  const h = harness({ 'users/customer': customer, 'reservations/other': { ...reservation, customerId: 'other' }, 'reservations/past': { ...reservation, date: '2000-10-12' }, 'reservations/r1': reservation });
  const service = h.load('src/services/reservations/customer.ts');
  await assert.rejects(service.changeCustomerBooking('other', null), /does not belong/);
  await assert.rejects(service.changeCustomerBooking('past', null), /Only active future/);
  await service.changeCustomerBooking('r1', null);
  assert.equal(h.records['reservations/r1'].status, 'cancelled');
  await assert.rejects(service.changeCustomerBooking('r1', null), /Only active future/);
});
test('customer listeners exclude other customers and tolerate optional fields', () => {
  const h = harness({ 'reservations/mine': reservation, 'reservations/other': { ...reservation, customerId: 'other' } });
  let rows;
  h.load('src/services/reservations/customer.ts').listenCustomerBookings('customer', value => { rows = value; }, assert.fail);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, 'mine');
});
test('staff login denies missing/inactive profiles and signs out; valid manager succeeds', async () => {
  const h = harness({ 'staffAccounts/manager': manager, 'staffAccounts/inactive': { ...manager, uid: 'inactive', email: 'inactive@example.com', isActive: false } });
  const service = h.load('src/services/staff/accounts.ts');
  await assert.rejects(service.staffLogin('missing@example.com', 'password'), /No staff profile/);
  assert.equal(h.auth.currentUser, null);
  await assert.rejects(service.staffLogin('inactive@example.com', 'password'), /inactive/);
  assert.equal(h.auth.currentUser, null);
  assert.equal((await service.staffLogin('manager@example.com', 'password')).role, 'manager');
});
test('manager profile edits are metadata-only and protect self access', async () => {
  const h = harness({ 'staffAccounts/manager': manager }, 'manager');
  const service = h.load('src/services/staff/accounts.ts');
  const profile = { uid: 'staff', fullName: 'Staff Member', email: 'staff@example.com', role: 'staff', isActive: true };
  await service.saveStaffProfile(profile, true);
  assert.equal(h.auth.currentUser.uid, 'manager');
  assert.equal(h.records['staffAccounts/staff'].createdAt, 'server-time');
  await service.saveStaffProfile({ ...profile, isActive: false });
  assert.equal(h.records['staffAccounts/staff'].isActive, false);
  await assert.rejects(service.saveStaffProfile({ ...manager, isActive: false }), /cannot deactivate/);
  h.auth.currentUser = { uid: 'staff', email: 'staff@example.com' };
  await assert.rejects(service.saveStaffProfile(profile), /inactive/);
});
test('date and input validation reject invalid calendar days', () => {
  const { load } = harness();
  const service = load('src/features/vimandya/validation.ts');
  assert.ok(Number.isNaN(service.bookingArrival({ date: '2099-02-30', time: '18:00' })));
  assert.throws(() => service.validateChanges({ ...reservation, partySize: 1.5 }), /whole party/);
});

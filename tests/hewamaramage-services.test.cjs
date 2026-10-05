/* global __dirname */
// Real service modules, mocked Firebase boundary. No network or real data writes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

function harness(seed = {}, signedIn = 'staff') {
  const data = structuredClone(seed);
  const auth = { currentUser: signedIn ? { uid: signedIn, email: `${signedIn}@example.com` } : null };
  const modules = {};
  let sequence = 0;
  const ref = (name, id) => ({ id, path: `${name}/${id}` });
  const snapshot = reference => ({ id: reference.id, ref: reference, exists: () => data[reference.path] !== undefined, data: () => data[reference.path] });
  const find = q => Object.keys(data).filter(key => key.startsWith(`${q.name}/`) && (!q.filter || (q.filter.op === 'in' ? q.filter.value.includes(data[key][q.filter.field]) : data[key][q.filter.field] === q.filter.value))).map(key => snapshot(ref(q.name, key.split('/')[1])));
  const sdk = {
    collection: (_, name) => name,
    doc: (first, name, id) => typeof first === 'string' ? ref(first, `record-${++sequence}`) : ref(name, id),
    getDoc: async reference => snapshot(reference),
    getDocs: async query => { const docs = find(typeof query === 'string' ? { name: query } : query); return { docs, size: docs.length }; },
    query: (name, filter) => ({ name, filter }), where: (field, op, value) => ({ field, op, value }),
    serverTimestamp: () => 'server-time', Timestamp: { now: () => 'client-time' },
    arrayUnion: value => ({ arrayUnion: value }),
    runTransaction: async (_, action) => {
      const writes = [];
      const apply = (reference, values, merge) => {
        const updated = merge ? { ...data[reference.path], ...values } : { ...values };
        for (const [key, value] of Object.entries(values)) if (value && typeof value === 'object' && 'arrayUnion' in value) updated[key] = [...(data[reference.path]?.[key] || []), value.arrayUnion];
        data[reference.path] = updated;
      };
      const result = await action({ get: async reference => snapshot(reference),
        set: (reference, values, options) => writes.push(() => apply(reference, values, options?.merge)),
        update: (reference, values) => writes.push(() => apply(reference, values, true)),
        delete: reference => writes.push(() => { delete data[reference.path]; }),
      });
      writes.forEach(write => write()); return result;
    },
    onSnapshot: (name, next) => { const docs = find({ name }); next({ docs }); return () => {}; },
  };
  function load(relative) {
    const filename = path.resolve(__dirname, '..', relative);
    if (modules[filename]) return modules[filename].exports;
    const module = { exports: {} }; modules[filename] = module;
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })(name => {
      if (name === 'firebase/firestore') return sdk;
      if (name === '@/config/firebase') return { auth, db: {} };
      if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
      if (name.startsWith('.')) return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), `${name}.ts`)));
      throw new Error(`Unexpected import: ${name}`);
    }, module, module.exports);
    return module.exports;
  }
  return { data, auth, load };
}
const staff = { uid: 'staff', fullName: 'Staff Member', email: 'staff@example.com', role: 'staff', isActive: true };
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
const booking = { customerId: 'customer', customerName: 'Existing Customer', customerEmail: 'customer@example.com', date: today(), time: '00:00', partySize: 4, status: 'confirmed', createdAt: 'original', seatingPreference: 'Indoor', specialRequest: 'Birthday' };
const table = { tableNumber: 'T1', capacity: 4, area: 'Main Floor', status: 'available' };
const walkIn = { customerName: 'Walk In', phoneNumber: '', partySize: 4, seatingPreference: 'No preference' };

test('authorization refuses unauthenticated, inactive, wrong email and kitchen operations', async () => {
  for (const [profile, uid] of [[staff, null], [{ ...staff, isActive: false }, 'staff'], [{ ...staff, email: 'other@example.com' }, 'staff'], [{ ...staff, role: 'kitchen' }, 'staff']]) {
    const h = harness({ 'staffAccounts/staff': profile }, uid);
    await assert.rejects(h.load('src/services/queue/walk-in.ts').registerWalkIn(walkIn));
    assert.equal(Object.keys(h.data).filter(key => key.startsWith('queueEntries/')).length, 0);
  }
});
test('reservation lifecycle atomically assigns/seats/completes and preserves customer schema', async () => {
  const h = harness({ 'staffAccounts/staff': staff, 'reservations/r1': booking, 'tables/t1': table });
  const service = h.load('src/services/reservations/staff-operations.ts');
  await service.updateOperationalReservation('r1', { tableId: 't1' });
  assert.equal(h.data['tables/t1'].status, 'reserved');
  assert.equal(h.data['reservations/r1'].tableNumber, 'T1');
  await service.updateOperationalReservation('r1', { status: 'arrived' });
  await service.updateOperationalReservation('r1', { status: 'seated' });
  assert.equal(h.data['tables/t1'].status, 'occupied');
  await service.updateOperationalReservation('r1', { status: 'completed' });
  assert.equal(h.data['tables/t1'].status, 'cleaning');
  assert.equal(h.data['tables/t1'].reservationId, null);
  assert.equal(h.data['reservations/r1'].createdAt, 'original');
  assert.equal(h.data['reservations/r1'].customerId, 'customer');
  assert.equal(h.data['reservations/r1'].specialRequest, 'Birthday');
  assert.equal(h.data['reservations/r1'].activity.length, 3);
  await assert.rejects(service.updateOperationalReservation('r1', { status: 'arrived' }), /closed/);
});
test('seating requires assignment and capacity; conflicting table ownership is rejected', async () => {
  const h = harness({ 'staffAccounts/staff': staff, 'reservations/r1': { ...booking, status: 'arrived' }, 'tables/small': { ...table, capacity: 2 }, 'tables/taken': { ...table, status: 'reserved', reservationId: 'other' } });
  const service = h.load('src/services/reservations/staff-operations.ts');
  await assert.rejects(service.updateOperationalReservation('r1', { status: 'seated' }), /Assign/);
  await assert.rejects(service.updateOperationalReservation('r1', { tableId: 'small' }), /too small/);
  await assert.rejects(service.updateOperationalReservation('r1', { tableId: 'taken' }), /another reservation/);
  assert.equal(h.data['reservations/r1'].status, 'arrived');
});
test('table reassignment releases only previous linked table and reserves new table', async () => {
  const h = harness({ 'staffAccounts/staff': staff, 'reservations/r1': { ...booking, tableId: 'old', tableNumber: 'T1' }, 'tables/old': { ...table, status: 'reserved', reservationId: 'r1' }, 'tables/new': { ...table, tableNumber: 'T2' } });
  await h.load('src/services/reservations/staff-operations.ts').updateOperationalReservation('r1', { tableId: 'new' });
  assert.equal(h.data['tables/old'].status, 'available');
  assert.equal(h.data['tables/new'].reservationId, 'r1');
  assert.equal(h.data['reservations/r1'].tableNumber, 'T2');
});
test('no-show is guarded by arrival time; cancellation preserves history and alerts', async () => {
  const h = harness({ 'staffAccounts/staff': staff, 'reservations/future': { ...booking, date: '2099-01-01' }, 'reservations/r1': booking });
  const service = h.load('src/services/reservations/staff-operations.ts');
  await assert.rejects(service.updateOperationalReservation('future', { status: 'no_show' }), /arrival time/);
  await service.updateOperationalReservation('r1', { status: 'cancelled' });
  assert.equal(h.data['reservations/r1'].status, 'cancelled');
  assert.equal(h.data['staffAlerts/r1-cancelled'].type, 'cancellation');
  assert.equal(h.data['kitchenAlerts/staff-r1-cancelled'].acknowledged, false);
  assert.equal(h.data['customerNotifications/staff-r1-cancelled'].customerId, 'customer');
  await assert.rejects(service.updateOperationalReservation('r1', { status: 'cancelled' }), /closed/);
});
test('walk-ins coexist with customer queue and share serialization guard', async () => {
  const h = harness({ 'staffAccounts/staff': staff, 'queueEntries/customer-entry': { customerId: 'customer', status: 'waiting', position: 2 }, 'queueEntries/old': { status: 'cancelled', position: 20 }, 'queueState/order': { activeIds: ['customer-entry', 'old'] } });
  const result = await h.load('src/services/queue/walk-in.ts').registerWalkIn({ ...walkIn, partySize: 10 });
  const record = h.data[`queueEntries/${result.id}`];
  assert.equal(result.position, 3); assert.equal(record.estimatedWaitMinutes, 15);
  assert.equal(record.customerId, null); assert.equal(record.source, 'walk_in');
  assert.equal(record.status, 'waiting'); assert.equal(record.joinedAt, 'server-time');
  assert.deepEqual(h.data['queueState/order'].activeIds, ['customer-entry', result.id]);
  assert.equal(h.data[`staffAlerts/walk-in-${result.id}`].type, 'large_group');
  assert.equal(h.data['queueEntries/customer-entry'].customerId, 'customer');
});
test('walk-in preview, stored wait and returned initial wait share the same queue calculation', async () => {
  const states = [[], [{ status: 'waiting', position: 1 }], [{ status: 'called', position: 2 }, { status: 'seated', position: 9 }, { status: 'cancelled', position: 20 }]];
  for (const entries of states) {
    const seed = Object.fromEntries(entries.map((entry, index) => [`queueEntries/q${index}`, entry]));
    const h = harness({ 'staffAccounts/staff': staff, ...seed });
    const preview = h.load('src/features/staff-operations/helpers.ts').estimateWalkInQueue(entries);
    const result = await h.load('src/services/queue/walk-in.ts').registerWalkIn(walkIn);
    const saved = h.data[`queueEntries/${result.id}`];
    assert.equal(result.position, preview.position);
    assert.equal(result.estimatedWaitMinutes, preview.estimatedWaitMinutes);
    assert.equal(saved.estimatedWaitMinutes, preview.estimatedWaitMinutes);
  }
});
test('invalid walk-in inputs and terminal transitions never write', async () => {
  const h = harness({ 'staffAccounts/staff': staff, 'reservations/r1': booking });
  const service = h.load('src/services/queue/walk-in.ts');
  await assert.rejects(service.registerWalkIn({ ...walkIn, partySize: 0 }), /party size/);
  await assert.rejects(service.registerWalkIn({ ...walkIn, phoneNumber: 'abc' }), /phone/);
  await assert.rejects(h.load('src/services/reservations/staff-operations.ts').updateOperationalReservation('r1', { status: 'completed' }), /not allowed/);
  assert.equal(h.data['reservations/r1'].status, 'confirmed');
});
test('table CRUD prevents duplicate numbers and protects occupied/linked tables', async () => {
  const h = harness({ 'staffAccounts/staff': staff });
  const service = h.load('src/services/tables/staff-operations.ts');
  const id = await service.saveOperationalTable(table);
  await assert.rejects(service.saveOperationalTable({ ...table, tableNumber: 't1' }), /already exists/);
  await service.saveOperationalTable({ ...table, capacity: 6, status: 'occupied' }, id);
  assert.equal(h.data[`tables/${id}`].createdAt, 'server-time');
  await assert.rejects(service.deleteOperationalTable(id), /in use/);
  await service.saveOperationalTable({ ...table, capacity: 6, status: 'available' }, id);
  assert.equal(h.data[`staffAlerts/table-ready-${id}`].type, 'table_ready');
  await service.deleteOperationalTable(id);
  assert.equal(h.data[`tables/${id}`], undefined);
  assert.equal(h.data['tableNumbers/T1'], undefined);
});
test('legacy active reservation link prevents table deletion/status override', async () => {
  const h = harness({ 'staffAccounts/staff': staff, 'tables/t1': table, 'reservations/r1': { ...booking, tableId: 't1' } });
  const service = h.load('src/services/tables/staff-operations.ts');
  await assert.rejects(service.deleteOperationalTable('t1'), /in use/);
  await assert.rejects(service.saveOperationalTable({ ...table, status: 'occupied' }, 't1'), /active reservation/);
  assert.equal(h.data['tables/t1'].status, 'available');
});
test('staff alerts mark-read is idempotent and rejects missing records', async () => {
  const h = harness({ 'staffAccounts/staff': staff, 'staffAlerts/a1': { title: 'Alert', read: false } });
  const service = h.load('src/services/notifications/staff-alerts.ts');
  await service.readStaffAlerts(['a1', 'a1']); await service.readStaffAlerts(['a1']);
  assert.equal(h.data['staffAlerts/a1'].read, true);
  await assert.rejects(service.readStaffAlerts(['missing']), /no longer exists/);
});
test('legacy reservation decoding tolerates optional fields and history keeps closed records', () => {
  const h = harness(); const record = h.load('src/services/staff/operations-listeners.ts').readReservation('r1', booking);
  assert.equal(record.tableId, undefined); assert.deepEqual(record.activity, []);
  const helpers = h.load('src/features/staff-operations/helpers.ts');
  assert.equal(helpers.historical({ ...record, status: 'cancelled' }), true);
  assert.equal(helpers.historical({ ...record, date: '2000-01-01' }), true);
  assert.equal(helpers.historical(record), false);
  assert.ok(Number.isNaN(helpers.arrivalMillis({ date: '2026-02-30', time: '18:00' })));
  assert.equal(helpers.calendarDays().length, 14);
});

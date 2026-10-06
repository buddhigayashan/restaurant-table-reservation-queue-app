/* global __dirname */
// Run: node --test tests/pankaja-services.test.cjs
// Transpile the real TypeScript services; replace only the Firestore boundary.
// These tests never connect to Firebase or write real project data.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

function harness(initial = {}) {
  const records = { 'staffAccounts/staff': { uid: 'staff', email: 'staff@example.com', role: 'staff', isActive: true }, ...structuredClone(initial) };
  const auth = { currentUser: { uid: 'staff', email: 'staff@example.com' } };
  let sequence = 0;
  const cache = {};
  const snapshot = (ref) => ({ id: ref.id, ref, exists: () => !!records[ref.path], data: () => records[ref.path] });
  const firebase = {
    collection: (_, name) => name,
    doc: (first, name, id) => { if (typeof first === 'string') { id = `generated-${++sequence}`; name = first; } return { id, path: `${name}/${id}` }; },
    getDoc: async ref => snapshot(ref),
    where: (field, op, value) => ({ field, op, value }),
    query: (name, filter) => ({ name, filter }),
    serverTimestamp: () => 'mock-timestamp',
    getDocs: async query => {
      const q = typeof query === 'string' ? { name: query } : query;
      const docs = Object.keys(records).filter(key => key.startsWith(`${q.name}/`) && (!q.filter || (q.filter.op === 'in' ? q.filter.value.includes(records[key][q.filter.field]) : records[key][q.filter.field] === q.filter.value))).map(key => snapshot({ path: key, id: key.split('/')[1] }));
      return { docs, size: docs.length };
    },
    runTransaction: async (_, action) => {
      const writes = [];
      const result = await action({
        get: async ref => snapshot(ref),
        set: (ref, data) => writes.push(() => { records[ref.path] = { ...records[ref.path], ...data }; }),
        update: (ref, data) => writes.push(() => { records[ref.path] = { ...records[ref.path], ...data }; }),
        delete: ref => writes.push(() => { delete records[ref.path]; }),
      });
      writes.forEach(write => write());
      return result;
    },
    onSnapshot: (name, next) => {
      next({ docs: Object.keys(records).filter(key => key.startsWith(`${name}/`)).map(key => snapshot({ path: key, id: key.split('/')[1] })) });
      return () => {};
    },
  };
  function load(relative) {
    const filename = path.resolve(__dirname, '..', relative);
    if (cache[filename]) return cache[filename].exports;
    const module = { exports: {} };
    cache[filename] = module;
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename })(name => {
      if (name === 'firebase/firestore') return firebase;
      if (name === '@/config/firebase') return { auth, db: {} };
      if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
      if (name.startsWith('.')) return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), `${name}.ts`)));
      throw new Error(`Unexpected import ${name}`);
    }, module, module.exports);
    return module.exports;
  }
  return { records, load };
}

test('reservation dates and next-hour filtering reject invalid/cancelled records', () => {
  const { load } = harness();
  const { arrivalMillis, nextHour } = load('src/features/kitchen/operations.ts');
  const record = { date: '2030-04-02', time: '12:30', status: 'confirmed' };
  const now = new Date(2030, 3, 2, 12).getTime();
  assert.equal(nextHour([record, { ...record, status: 'cancelled' }, { ...record, time: '14:00' }], now).length, 1);
  assert.ok(Number.isNaN(arrivalMillis({ ...record, date: '2030-02-30' })));
});

test('table CRUD validates capacity, duplicates and occupied deletion', async () => {
  const { records, load } = harness();
  const service = load('src/services/tables/management.ts');
  const table = { tableNumber: 'T1', capacity: 4, status: 'available', area: 'Main Floor' };
  await assert.rejects(service.saveTable({ ...table, capacity: 0 }), /Capacity/);
  const id = await service.saveTable(table);
  await assert.rejects(service.saveTable(table), /already exists/);
  await service.saveTable({ ...table, capacity: 6 }, id);
  assert.equal(records[`tables/${id}`].capacity, 6);
  await service.changeTableStatus(id, 'occupied');
  await assert.rejects(service.removeTable(id), /in use/);
  await service.changeTableStatus(id, 'cleaning');
  await service.removeTable(id);
  assert.equal(records[`tables/${id}`], undefined);
});

test('malformed table status reaches listener error callback', () => {
  const { load } = harness({ 'tables/T1': { status: 'unknown' } });
  let failure;
  load('src/services/tables/management.ts').listenTables(() => assert.fail('Must not display malformed data'), error => { failure = error; });
  assert.match(failure.message, /unsupported status/);
});

test('queue call, seat and cancel preserve order and occupy an assigned table', async () => {
  const { records, load } = harness({
    'queueEntries/a': { status: 'waiting', position: 1, partySize: 4 },
    'queueEntries/b': { status: 'waiting', position: 2, partySize: 2 },
    'tables/T1': { tableNumber: 'T1', capacity: 4, status: 'available' },
  });
  const { updateQueue } = load('src/services/queue/management.ts');
  await assert.rejects(updateQueue('seat', 'a'), /Call this customer/);
  await updateQueue('call');
  assert.equal(records['queueEntries/a'].status, 'called');
  await assert.rejects(updateQueue('call'), /Seat or cancel/);
  records['tables/T1'].capacity = 2;
  await assert.rejects(updateQueue('seat', 'a', 'T1'), /enough seats/);
  assert.equal(records['queueEntries/a'].status, 'called');
  records['tables/T1'].capacity = 4;
  await updateQueue('seat', 'a', 'T1');
  assert.equal(records['queueEntries/a'].status, 'seated');
  assert.equal(records['tables/T1'].status, 'occupied');
  assert.equal(records['queueEntries/b'].position, 1);
  await updateQueue('cancel', 'b');
  assert.equal(records['queueEntries/b'].status, 'cancelled');
  await assert.rejects(updateQueue('call'), /No matching active/);
});

test('large-group alerts are idempotent and preserve acknowledgement/reservations', async () => {
  const reservation = { id: 'r1', customerName: 'Test guest', date: '2099-04-02', time: '12:30', partySize: 8, status: 'confirmed' };
  const { records, load } = harness({ 'reservations/r1': reservation });
  const service = load('src/services/notifications/kitchen-alerts.ts');
  await service.generateLargePartyAlerts([reservation]);
  assert.equal(records['kitchenAlerts/large-group-r1'].acknowledged, false);
  await service.acknowledgeKitchenAlert('large-group-r1');
  await service.generateLargePartyAlerts([reservation]);
  assert.equal(records['kitchenAlerts/large-group-r1'].acknowledged, true);
  assert.deepEqual(records['reservations/r1'], reservation);
  assert.equal(Object.keys(records).filter(key => key.startsWith('kitchenAlerts/')).length, 1);
});

test('existing customer fields decode without optional table information', () => {
  const { load } = harness({ 'reservations/r1': { customerName: 'Test guest', date: '2030-04-02', time: '12:30', partySize: 2, seatingPreference: 'Indoor', specialRequest: 'Vegetarian', status: 'confirmed' } });
  let rows;
  load('src/services/reservations/kitchen.ts').listenKitchenReservations(value => { rows = value; }, assert.fail);
  assert.equal(rows[0].customerName, 'Test guest');
  assert.equal(rows[0].specialRequest, 'Vegetarian');
  assert.equal(rows[0].tableNumber, undefined);
});

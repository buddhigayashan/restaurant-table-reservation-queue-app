const { test } = require('node:test');
const assert = require('node:assert/strict');
const { harness } = require('./support/firestore-harness.cjs');
const manager = { uid: 'manager', email: 'manager@example.com', fullName: 'Manager', role: 'manager', isActive: true };
const settings = () => ({ openingHours: Array.from({ length: 7 }, () => ({ enabled: true, open: '17:00', close: '21:30' })), bookingIntervalMinutes: 30, maxPartySize: 6, closedDates: [] });
test('settings writes require an active manager and validate hours, limits and calendar dates', async () => {
  const h = harness({ 'staffAccounts/manager': manager }, 'manager'); const service = h.load('src/services/staff/restaurant.ts');
  await service.saveRestaurantSettings(settings()); assert.equal(h.data['restaurantSettings/general'].maxPartySize, 6);
  await assert.rejects(service.saveRestaurantSettings({ ...settings(), closedDates: ['2026-02-30'] }), /valid closed/);
  await assert.rejects(service.saveRestaurantSettings({ ...settings(), maxPartySize: 21 }), /maximum party/);
  h.data['staffAccounts/manager'].role = 'staff'; await assert.rejects(service.saveRestaurantSettings(settings()), /Manager access/);
});
test('new bookings and edits enforce saved restaurant hours, intervals, closed dates and party limit', async () => {
  const profile = { uid: 'customer', email: 'customer@example.com', fullName: 'Customer', role: 'customer' };
  const h = harness({ 'users/customer': profile, 'restaurantSettings/general': settings() }, 'customer');
  const service = h.load('src/services/reservations/customer.ts'); const input = { date: '2099-10-12', time: '18:30', partySize: 4, seatingPreference: 'No preference', specialRequest: '' }; const id = service.createBookingReference();
  await service.createCustomerReservation(id, input);
  await assert.rejects(service.changeCustomerBooking(id, { ...input, time: '18:15' }), /not open/);
  await assert.rejects(service.createCustomerReservation(service.createBookingReference(), { ...input, partySize: 10 }), /up to 6/);
  h.data['restaurantSettings/general'].closedDates = [input.date]; await assert.rejects(service.createCustomerReservation(service.createBookingReference(), input), /not open/);
  await service.changeCustomerBooking(id, null); assert.equal(h.data[`reservations/${id}`].status, 'cancelled');
});
test('floor layout updates preserve live table status, capacity and reservation links and reject collisions', async () => {
  const h = harness({ 'staffAccounts/manager': manager, 'tables/t1': { tableNumber: '1', capacity: 4, status: 'occupied', reservationId: 'real' }, 'tables/t2': { tableNumber: '2', capacity: 2, status: 'available' } }, 'manager');
  const service = h.load('src/services/staff/restaurant.ts'); const layout = [{ id: 't1', row: 1, column: 0, shape: 'round' }, { id: 't2', row: 1, column: 1, shape: 'square' }];
  await service.saveTableLayout(layout); assert.equal(h.data['tables/t1'].status, 'occupied'); assert.equal(h.data['tables/t1'].reservationId, 'real'); assert.equal(h.data['tables/t1'].capacity, 4);
  await assert.rejects(service.saveTableLayout([layout[0], { ...layout[1], column: 0 }]), /unique position/);
  await assert.rejects(service.saveTableLayout([{ ...layout[0], id: 'missing' }]), /removed/);
  h.data['staffAccounts/manager'].role = 'staff'; await assert.rejects(service.saveTableLayout(layout), /Manager access/);
});
test('reports calculate real period totals and show no estimate when timestamped queue evidence is missing', () => {
  const h = harness(); const { operationalReport } = h.load('src/features/staff-operations/reports.ts');
  const rows = [{ date: '2026-10-06', time: '18:00', partySize: 4, status: 'completed' }, { date: '2026-10-06', time: '18:00', partySize: 6, status: 'no_show' }, { date: '2026-10-05', time: '19:00', partySize: 2, status: 'confirmed' }];
  const report = operationalReport(rows, [], [{ id: '1' }, { id: '2' }], 1, new Date(2026, 9, 6, 23));
  assert.equal(report.guests, 4); assert.equal(report.noShowRate, 50); assert.equal(report.turnover, 0.5); assert.equal(report.averageEstimate, null); assert.equal(report.peak[0].guests, 4);
});
test('expanded manager routes reject staff, kitchen and customer roles', () => {
  const { canOpenArea } = harness().load('src/features/auth/access.ts');
  for (const route of ['account-management', 'restaurant-settings', 'table-setup', 'reports-analytics']) { assert.equal(canOpenArea('manager', 'staff', route), true); for (const role of ['customer', 'staff', 'kitchen']) assert.equal(canOpenArea(role, 'staff', route), false); }
});

test('an arrived guest receives one table-ready notice on assignment without resetting its read state', async () => {
  const h = harness({ 'staffAccounts/manager': manager, 'reservations/r1': { customerId: 'customer', customerName: 'Guest', date: '2099-10-12', time: '18:30', partySize: 4, status: 'arrived' }, 'tables/t1': { tableNumber: '1', capacity: 4, status: 'available' } }, 'manager');
  const service = h.load('src/services/reservations/staff-operations.ts');
  await service.updateOperationalReservation('r1', { tableId: 't1' });
  assert.equal(h.data['customerNotifications/r1-table-ready-t1'].type, 'table_ready');
  h.data['customerNotifications/r1-table-ready-t1'].read = true;
  await service.updateOperationalReservation('r1', { tableId: 't1' });
  assert.equal(h.data['customerNotifications/r1-table-ready-t1'].read, true);
});

// Real cross-member services against an in-memory boundary; never touches Firebase.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { harness } = require('./support/firestore-harness.cjs');
const customer = { uid: 'customer', fullName: 'Integration Customer', email: 'customer@example.com', phoneNumber: '+94771234567', role: 'customer' };
const staff = { uid: 'staff', fullName: 'Integration Staff', email: 'staff@example.com', role: 'staff', isActive: true };
const table = { tableNumber: 'T1', capacity: 10, area: 'Main Floor', status: 'available' };
const input = { date: '2099-10-12', time: '18:30', partySize: 10, seatingPreference: 'Indoor', specialRequest: 'Birthday' };

test('booking creation feeds customer, staff and kitchen readers; retry preserves edits and acknowledgement', async () => {
  const h = harness({ 'users/customer': customer, 'staffAccounts/staff': staff }, 'customer');
  const service = h.load('src/services/reservations/customer.ts');
  const id = service.createBookingReference();
  await service.createCustomerReservation(id, input);
  let bookings; const stop = service.listenCustomerBookings('customer', rows => { bookings = rows; }, assert.fail);
  assert.equal(bookings[0].id, id);
  stop();
  let kitchen; h.load('src/services/reservations/kitchen.ts').listenKitchenReservations(rows => { kitchen = rows; }, assert.fail);
  assert.equal(kitchen[0].specialRequest, 'Birthday');
  h.auth.currentUser = { uid: 'staff', email: staff.email };
  await h.load('src/services/notifications/kitchen-alerts.ts').acknowledgeKitchenAlert(`large-group-${id}`);
  h.auth.currentUser = { uid: 'customer', email: customer.email };
  await service.changeCustomerBooking(id, { ...input, specialRequest: 'Vegetarian' });
  await service.createCustomerReservation(id, input);
  assert.equal(h.data[`reservations/${id}`].specialRequest, 'Vegetarian');
  assert.equal(h.data[`kitchenAlerts/large-group-${id}`].acknowledged, true);
  assert.equal(Object.keys(h.data).filter(key => key.startsWith('reservations/')).length, 1);
  assert.ok(Object.keys(h.data).some(key => key.startsWith('staffAlerts/reservation-change-')));
  stop();
});

test('customer edit/cancel releases an assigned table and preserves history', async () => {
  const h = harness({ 'users/customer': customer, 'staffAccounts/staff': staff, 'tables/t1': table }, 'customer');
  const service = h.load('src/services/reservations/customer.ts'); const id = service.createBookingReference();
  await service.createCustomerReservation(id, input);
  h.auth.currentUser = { uid: 'staff', email: staff.email };
  await h.load('src/services/reservations/staff-operations.ts').updateOperationalReservation(id, { tableId: 't1' });
  assert.equal(h.data['tables/t1'].status, 'reserved');
  h.auth.currentUser = { uid: 'customer', email: customer.email };
  await service.changeCustomerBooking(id, { ...input, date: '2099-10-13' });
  assert.equal(h.data['tables/t1'].status, 'available');
  assert.equal(h.data[`reservations/${id}`].tableId, null);
  await service.changeCustomerBooking(id, null);
  assert.equal(h.data[`reservations/${id}`].status, 'cancelled');
  assert.equal(h.data[`reservations/${id}`].createdAt, 'server-time');
  await assert.rejects(service.changeCustomerBooking(id, input), /Only active/);
});

test('customer queue and walk-in coexist; staff actions stream to customer with one notice per state', async () => {
  const h = harness({ 'users/customer': customer, 'staffAccounts/staff': staff, 'tables/t1': table }, 'customer');
  const staffClient = h.client('staff');
  const queue = h.load('src/services/queue/customer.ts');
  const id = await queue.joinCustomerQueue({ customerName: customer.fullName, phoneNumber: customer.phoneNumber, partySize: 4, seatingPreference: 'Indoor', acknowledged: true });
  let current; const stop = queue.listenOwnQueue('customer', rows => { current = rows[0]; }, assert.fail);
  assert.equal(current.status, 'waiting');
  const walk = await staffClient.load('src/services/queue/walk-in.ts').registerWalkIn({ customerName: 'Integration Walk In', phoneNumber: '', partySize: 3, seatingPreference: 'Indoor' });
  assert.equal(walk.estimatedWaitMinutes, 10);
  const operations = staffClient.load('src/services/queue/management.ts');
  await operations.updateQueue('call');
  assert.equal(current.status, 'called');
  const notices = h.load('src/services/notifications/customer.ts');
  await notices.ensureQueueStatusNotice(id);
  await notices.markNoticesRead([`${id}-called`]);
  await notices.ensureQueueStatusNotice(id);
  assert.equal(h.data[`customerNotifications/${id}-called`].read, true);
  await operations.updateQueue('seat', id, 't1');
  assert.equal(h.data['tables/t1'].status, 'occupied');
  assert.equal(current.status, 'seated');
  assert.equal(h.data[`queueEntries/${walk.id}`].position, 1);
  assert.equal(h.data[`queueEntries/${walk.id}`].estimatedWaitMinutes, 5);
  stop();
});

test('customer cancellation reorders other parties while keeping its history', async () => {
  const h = harness({ 'users/customer': customer, 'queueEntries/other': { customerId: 'other', status: 'waiting', position: 2 } }, 'customer');
  const queue = h.load('src/services/queue/customer.ts');
  const id = await queue.joinCustomerQueue({ customerName: customer.fullName, phoneNumber: customer.phoneNumber, partySize: 2, seatingPreference: 'Indoor', acknowledged: true });
  await queue.leaveCustomerQueue(id);
  assert.equal(h.data['queueEntries/other'].position, 1);
  assert.equal(h.data[`queueEntries/${id}`].status, 'cancelled');
});

test('role destinations and access prevent cross-role routes and manager-only entry', () => {
  const { load } = harness(); const access = load('src/features/auth/access.ts');
  assert.equal(access.roleDestination('manager'), '/staff/dashboard');
  assert.equal(access.roleDestination('kitchen'), '/kitchen/upcoming-reservations');
  assert.equal(access.canOpenArea('customer', 'staff', 'dashboard'), false);
  assert.equal(access.canOpenArea('kitchen', 'staff', 'account-management'), false);
  assert.equal(access.canOpenArea('staff', 'staff', 'account-management'), false);
  assert.equal(access.canOpenArea('manager', 'staff', 'account-management'), true);
  assert.equal(access.canOpenArea(null, 'kitchen', 'today'), false);
});

test('integrated queue and kitchen writes enforce service authorization', async () => {
  const h = harness({ 'users/customer': customer }, 'customer');
  await assert.rejects(h.load('src/services/queue/management.ts').updateQueue('call'), /staff profile/);
  await assert.rejects(h.load('src/services/notifications/kitchen-alerts.ts').acknowledgeKitchenAlert('missing'), /staff profile/);
  assert.equal(Object.keys(h.data).length, 1);
});

test('profile editing changes only allowed fields; preferences and password validation are safe', async () => {
  const h = harness({ 'users/customer': customer }, 'customer'); const service = h.load('src/services/auth/customer-profile.ts');
  await service.updateCustomerDetails('Updated Customer', '+94771234568');
  assert.equal(h.data['users/customer'].fullName, 'Updated Customer');
  assert.equal(h.data['users/customer'].email, customer.email);
  assert.equal(h.data['users/customer'].uid, customer.uid);
  await service.saveNotificationPreferences({ bookingUpdates: false, queueUpdates: true });
  assert.equal(h.data['users/customer'].notificationPreferences.bookingUpdates, false);
  await assert.rejects(service.changeCustomerPassword('current', 'short', 'short'), /at least 8/);
  await assert.rejects(service.changeCustomerPassword('current', 'longpassword', 'different'), /do not match/);
});

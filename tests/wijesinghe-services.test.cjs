const { test } = require('node:test');
const assert = require('node:assert/strict');
const { harness } = require('./support/firestore-harness.cjs');

test('customer signup creates a linked profile without storing a password', async () => {
  const h = harness({}, null);
  await h.load('src/services/auth/customer.ts').signUpCustomer({ fullName: 'Customer', email: 'customer@example.com', phoneNumber: '+94771234567', password: 'sample-password', confirmPassword: 'sample-password' });
  const profile = h.data['users/customer'];
  assert.equal(profile.uid, h.auth.currentUser.uid);
  assert.equal(profile.role, 'customer');
  assert.equal(profile.createdAt, 'server-time');
  assert.equal('password' in profile, false);
  assert.equal('confirmPassword' in profile, false);
});
test('customer login rejects a missing or staff-only profile and clears its session', async () => {
  const h = harness({}, null); const auth = h.load('src/services/auth/customer.ts');
  await assert.rejects(auth.loginCustomer('customer@example.com', 'sample-password'), /profile is missing/);
  assert.equal(h.auth.currentUser, null);
  h.data['users/customer'] = { role: 'staff' };
  await assert.rejects(auth.loginCustomer('customer@example.com', 'sample-password'), /customer account/);
  assert.equal(h.auth.currentUser, null);
});
test('customer login succeeds only with a matching customer profile', async () => {
  const h = harness({ 'users/customer': { role: 'customer', fullName: 'Customer' } }, null);
  await h.load('src/services/auth/customer.ts').loginCustomer('customer@example.com', 'sample-password');
  assert.equal(h.auth.currentUser.uid, 'customer');
});
test('booking validation rejects impossible dates, elapsed slots and invalid guest counts', () => {
  const { load } = harness(); const { validateBooking } = load('src/features/customer/validation.ts');
  const input = { date: '2099-10-12', time: '18:30', partySize: 2, seatingPreference: '', specialRequest: '' };
  assert.equal(validateBooking(input), null);
  assert.match(validateBooking({ ...input, date: '2099-02-30' }), /valid date/);
  assert.match(validateBooking({ ...input, date: '2000-01-01' }), /future/);
  assert.match(validateBooking({ ...input, partySize: 0 }), /guest count/);
});
test('password reset validates email before requesting a reset', async () => {
  const { load } = harness(); const auth = load('src/services/auth/customer.ts');
  await assert.rejects(auth.resetCustomerPassword('invalid'), /valid email/);
  await auth.resetCustomerPassword('customer@example.com');
});

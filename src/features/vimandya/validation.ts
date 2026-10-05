import type { BookingChanges, CustomerBooking, QueueInput, StaffProfile } from '@/types/vimandya';
import { staffRoles } from '@/types/vimandya';

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function bookingArrival(record: { date: string; time: string }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(record.time)) return NaN;
  const [y, m, d] = record.date.split('-').map(Number);
  const [h, minute] = record.time.split(':').map(Number);
  const date = new Date(y, m - 1, d, h, minute);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date.getTime() : NaN;
}
export function editableBooking(booking: CustomerBooking, now = Date.now()) {
  return ['confirmed', 'pending', 'reserved'].includes(booking.status) && bookingArrival(booking) > now;
}
export function validateParty(size: number) {
  if (!Number.isInteger(size) || size < 1 || size > 20) throw new Error('Choose a whole party size from 1 to 20.');
}
export function validateQueue(input: QueueInput) {
  if (input.customerName.trim().length < 2 || input.customerName.length > 80) throw new Error('Enter your full name (2–80 characters).');
  if (!/^[+()\d -]{7,20}$/.test(input.phoneNumber.trim()) || input.phoneNumber.replace(/\D/g, '').length < 7) throw new Error('Enter a valid phone number.');
  validateParty(input.partySize);
  if (!['Indoor', 'Outdoor', 'No preference'].includes(input.seatingPreference)) throw new Error('Choose a seating preference.');
  if (!input.acknowledged) throw new Error('Confirm that you will wait for your table.');
}
export function validateChanges(input: BookingChanges) {
  validateParty(input.partySize);
  if (!(bookingArrival(input) > Date.now())) throw new Error('Choose a valid future date and time.');
  if (!input.seatingPreference.trim() || input.seatingPreference.length > 60) throw new Error('Enter a seating preference (up to 60 characters).');
  if (input.specialRequest.length > 500) throw new Error('Keep special requests within 500 characters.');
}
export function validateStaff(profile: StaffProfile) {
  if (!profile.uid.trim() || profile.uid.includes('/') || profile.uid.length > 128) throw new Error('Enter the existing Authentication user UID.');
  if (profile.fullName.trim().length < 2 || profile.fullName.length > 80) throw new Error('Enter a staff name (2–80 characters).');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) throw new Error('Enter a valid email.');
  if (!staffRoles.includes(profile.role) || typeof profile.isActive !== 'boolean') throw new Error('Choose a valid role and account status.');
}
export function friendlyError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'permission-denied') return 'Access denied by Firestore. Contact the restaurant manager.';
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(code || '')) return 'Email or password is incorrect.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please try again later.';
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (code === 'unavailable' || code === 'auth/network-request-failed') return 'Unable to connect. Check your internet connection.';
  return error instanceof Error ? error.message : 'Unable to complete this action.';
}

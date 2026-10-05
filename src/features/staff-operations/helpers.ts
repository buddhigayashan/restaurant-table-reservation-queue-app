import type { StaffReservation, TableInput, WalkInInput, ReservationStatus } from '@/types/staff-operations';
import { tableStatuses } from '@/types/staff-operations';

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function estimateWalkInQueue(entries: { status: string; position: number }[]) {
  const active = entries.filter(entry => ['waiting', 'called'].includes(entry.status));
  const position = active.reduce((max, entry) => Math.max(max, Number(entry.position) || 0), 0) + 1;
  return { position, estimatedWaitMinutes: position * 5 };
}
export function calendarDays(count = 14) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => { const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index); return { date: localDate(date), day: date.getDate(), weekday: date.toLocaleDateString('en-US', { weekday: 'short' }) }; });
}
export function arrivalMillis(record: { date: string; time: string }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(record.time)) return NaN;
  const [year, month, day] = record.date.split('-').map(Number);
  const [hour, minute] = record.time.split(':').map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date.getTime() : NaN;
}
export function historical(record: StaffReservation, today = localDate()) {
  return ['completed', 'cancelled', 'no_show'].includes(record.status) || (!!record.date && record.date < today);
}
const transitions: Record<string, ReservationStatus[]> = {
  pending: ['confirmed', 'arrived', 'cancelled', 'no_show'], reserved: ['confirmed', 'arrived', 'cancelled', 'no_show'],
  confirmed: ['arrived', 'cancelled', 'no_show'], arrived: ['seated', 'cancelled'], seated: ['completed'],
};
export function allowedTransitions(status: string) { return transitions[status] || []; }
export function validateTransition(record: { status: string; date: string; time: string }, next: ReservationStatus, now = Date.now()) {
  if (!allowedTransitions(record.status).includes(next)) throw new Error('That reservation status change is not allowed.');
  const arrival = arrivalMillis(record);
  if (next === 'no_show' && (!Number.isFinite(arrival) || arrival > now)) throw new Error('A no-show can only be recorded after the arrival time.');
  if (['arrived', 'seated'].includes(next) && record.date !== localDate(new Date(now))) throw new Error('Arrival and seating are only available for today’s reservations.');
}
export function validateTable(input: TableInput) {
  if (!input.tableNumber.trim() || input.tableNumber.trim().length > 20 || input.tableNumber.includes('/')) throw new Error('Enter a table number (up to 20 characters, without /).');
  if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 30) throw new Error('Capacity must be a whole number from 1 to 30.');
  if (!input.area.trim() || input.area.length > 60 || !tableStatuses.includes(input.status)) throw new Error('Choose a valid status and area (up to 60 characters).');
}
export function validateWalkIn(input: WalkInInput) {
  if (input.customerName.trim().length < 2 || input.customerName.length > 80) throw new Error('Enter a guest name (2–80 characters).');
  if (input.phoneNumber.trim() && (!/^[+()\d -]{7,20}$/.test(input.phoneNumber.trim()) || input.phoneNumber.replace(/\D/g, '').length < 7)) throw new Error('Enter a valid phone number or leave it blank.');
  if (!Number.isInteger(input.partySize) || input.partySize < 1 || input.partySize > 20) throw new Error('Choose a whole party size from 1 to 20.');
  if (!['No preference', 'Indoor', 'Outdoor'].includes(input.seatingPreference)) throw new Error('Choose a seating preference.');
}
export function errorMessage(error: unknown) {
  if ((error as { code?: string })?.code === 'permission-denied') return 'Firestore denied access. Contact the project owner.';
  if ((error as { code?: string })?.code === 'unavailable') return 'Unable to connect. Check your internet connection.';
  return error instanceof Error ? error.message : 'Unable to complete the action.';
}

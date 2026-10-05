import { doc, collection, serverTimestamp, setDoc, onSnapshot, query, runTransaction, where } from 'firebase/firestore';

import { auth, db } from '@/config/firebase';
import { validateBooking } from '@/features/customer/validation';
import { getCustomerProfile } from '@/services/auth/customer';
import type { BookingInput, CustomerReservation } from '@/types/reservation';

import { checkSession, requireCustomer } from '@/services/auth/module-access';
import { editableBooking, validateChanges } from '@/features/vimandya/validation';
import type { BookingChanges, CustomerBooking } from '@/types/vimandya';

// Generate once for a form submission and retain on retry to prevent creating
// multiple documents if a write succeeds but its acknowledgement is interrupted.
export function createBookingReference(): string {
  return doc(collection(db, 'reservations')).id;
}

export async function createCustomerReservation(
  id: string,
  input: BookingInput
): Promise<CustomerReservation> {
  const user = auth.currentUser;
  if (!user) throw new Error('Log in before booking a table.');
  if (!/^[A-Za-z0-9]{20}$/.test(id)) throw new Error('Invalid booking reference.');
  const validationError = validateBooking(input);
  if (validationError) throw new Error(validationError);
  const profile = await getCustomerProfile(user.uid);
  if (!profile) throw new Error('Your customer profile is missing. Contact the restaurant.');
  const reservation = {
    date: input.date,
    time: input.time,
    partySize: input.partySize,
    seatingPreference: input.seatingPreference.trim(),
    specialRequest: input.specialRequest.trim(),
    customerId: user.uid,
    customerName: profile.fullName || user.displayName || 'Customer',
    customerEmail: user.email || profile.email,
    status: 'confirmed' as const,
  };
  await setDoc(doc(db, 'reservations', id), {
    ...reservation,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...reservation, id, createdAt: null, updatedAt: null };
}

export function decodeBooking(id: string, data: Record<string, unknown>): CustomerBooking {
  return { id, customerId: String(data.customerId || ''), customerName: String(data.customerName || ''), customerEmail: String(data.customerEmail || ''),
    date: String(data.date || ''), time: String(data.time || ''), partySize: Number(data.partySize) || 0,
    seatingPreference: String(data.seatingPreference || 'No preference'), specialRequest: String(data.specialRequest || ''), status: String(data.status || ''),
    tableId: data.tableId ? String(data.tableId) : undefined, tableNumber: data.tableNumber ? String(data.tableNumber) : undefined };
}
export function listenCustomerBookings(uid: string, next: (rows: CustomerBooking[]) => void, fail: (error: Error) => void) {
  try { checkSession(uid); } catch (error) { fail(error as Error); return () => {}; }
  return onSnapshot(query(collection(db, 'reservations'), where('customerId', '==', uid)), snapshot => {
    try { checkSession(uid); } catch (error) { fail(error as Error); return; }
    next(snapshot.docs.map(item => decodeBooking(item.id, item.data())).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)));
  }, fail);
}
export async function changeCustomerBooking(id: string, changes: BookingChanges | null) {
  const { uid } = await requireCustomer();
  if (changes) validateChanges(changes);
  const notice = doc(collection(db, 'customerNotifications'));
  await runTransaction(db, async tx => {
    const reference = doc(db, 'reservations', id);
    const snapshot = await tx.get(reference);
    checkSession(uid);
    if (!snapshot.exists() || snapshot.data().customerId !== uid) throw new Error('Reservation does not belong to your account.');
    const booking = decodeBooking(id, snapshot.data());
    if (!editableBooking(booking)) throw new Error('Only active future reservations can be changed or cancelled.');
    if (changes) validateChanges(changes);
    if (changes && Object.entries(changes).every(([key, value]) => booking[key as keyof CustomerBooking] === value)) throw new Error('No booking details have changed.');
    // Explicit fields preserve ownership, createdAt and optional table assignment.
    const updates = changes ? { date: changes.date, time: changes.time, partySize: changes.partySize, seatingPreference: changes.seatingPreference.trim(), specialRequest: changes.specialRequest.trim() } : { status: 'cancelled' };
    tx.update(reference, { ...updates, updatedAt: serverTimestamp() });
    const message = changes ? `Your booking is now ${changes.date} at ${changes.time} for ${changes.partySize} guests.` : 'Your reservation was cancelled.';
    tx.set(notice, { customerId: uid, type: 'booking_changed', title: changes ? 'Booking changed' : 'Booking cancelled', message, reservationId: id, read: false, createdAt: serverTimestamp() });
    // FR9: communicate changes to the shared kitchen inbox; no kitchen screen here.
    tx.set(doc(db, 'kitchenAlerts', `reservation-change-${notice.id}`), { type: changes ? 'reservation_change' : 'cancellation', title: changes ? 'Reservation changed' : 'Reservation cancelled',
      message: `${booking.customerName}: ${message}`, reservationId: id, severity: 'info', acknowledged: false, createdAt: serverTimestamp() });
  });
}

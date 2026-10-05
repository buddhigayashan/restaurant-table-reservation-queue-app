import { doc, collection, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '@/config/firebase';
import { validateBooking } from '@/features/customer/validation';
import { getCustomerProfile } from '@/services/auth/customer';
import type { BookingInput, CustomerReservation } from '@/types/reservation';

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

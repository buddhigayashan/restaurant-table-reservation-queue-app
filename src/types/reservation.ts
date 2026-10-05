import type { Timestamp } from 'firebase/firestore';

export type BookingInput = {
  date: string; // Local restaurant date: YYYY-MM-DD.
  time: string; // Local restaurant time: HH:mm (24-hour).
  partySize: number;
  seatingPreference: string;
  specialRequest: string;
};

export type CustomerReservation = BookingInput & {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'confirmed';
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

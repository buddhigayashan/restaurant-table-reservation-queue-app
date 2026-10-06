import type { Timestamp } from 'firebase/firestore';

export type CustomerProfile = {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'customer';
  createdAt: Timestamp | null;
  notificationPreferences?: { bookingUpdates: boolean; queueUpdates: boolean };
};

export type CustomerSignUpInput = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
};

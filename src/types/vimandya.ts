export type QueueStatus = 'waiting' | 'called' | 'seated' | 'cancelled';
export type CustomerQueueEntry = {
  id: string; customerId: string; customerName: string; phoneNumber: string;
  partySize: number; seatingPreference: string; position: number;
  estimatedWaitMinutes: number; status: QueueStatus; joinedAtMillis: number;
};
export type QueueInput = { customerName: string; phoneNumber: string; partySize: number; seatingPreference: string; acknowledged: boolean };
export type CustomerBooking = {
  id: string; customerId: string; customerName: string; customerEmail: string;
  date: string; time: string; partySize: number; seatingPreference: string;
  specialRequest: string; status: string; tableId?: string; tableNumber?: string;
};
export type BookingChanges = Pick<CustomerBooking, 'date' | 'time' | 'partySize' | 'seatingPreference' | 'specialRequest'>;
export type CustomerNotice = { id: string; customerId: string; type: string; title: string; message: string; read: boolean; createdAtMillis: number; reservationId?: string; queueEntryId?: string };
export const staffRoles = ['manager', 'staff', 'kitchen'] as const;
export type StaffRole = typeof staffRoles[number];
export type StaffProfile = { uid: string; fullName: string; email: string; role: StaffRole; isActive: boolean };

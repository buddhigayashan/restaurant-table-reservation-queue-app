export const reservationStatuses = ['confirmed', 'arrived', 'seated', 'completed', 'cancelled', 'no_show'] as const;
export type ReservationStatus = typeof reservationStatuses[number];
export const tableStatuses = ['available', 'reserved', 'occupied', 'cleaning'] as const;
export type TableStatus = typeof tableStatuses[number];
export type StaffMember = { uid: string; fullName: string; email: string; role: 'manager' | 'staff' | 'kitchen'; isActive: boolean };
export type StaffReservation = {
  id: string; customerId: string; customerName: string; customerEmail: string; phoneNumber: string;
  date: string; time: string; partySize: number; seatingPreference: string; specialRequest: string;
  status: string; tableId?: string; tableNumber?: string; createdAtMillis: number;
  activity: { status: string; atMillis: number }[];
};
export type FloorTable = { id: string; tableNumber: string; capacity: number; status: string; area: string; reservationId?: string; layoutRow?: number; layoutColumn?: number; shape?: 'round' | 'square'; };
export type TableInput = { tableNumber: string; capacity: number; status: TableStatus; area: string };
export type WalkInInput = { customerName: string; phoneNumber: string; partySize: number; seatingPreference: string };
export type OperationalQueueEntry = { id: string; customerName: string; partySize: number; position: number; status: string; estimatedWaitMinutes: number; joinedAtMillis?: number; updatedAtMillis?: number };
export type StaffAlert = { id: string; type: string; title: string; message: string; severity: string; read: boolean; createdAtMillis: number; reservationId?: string; queueEntryId?: string };

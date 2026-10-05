export type ReservationRecord = {
    id: string;
    customerName: string;
    date: string;
    time: string;
    partySize: number;
    status: string;
    seatingPreference: string;
    specialRequest: string;
    tableId?: string;
    tableNumber?: string;
};
export const tableStatuses = ['available', 'reserved', 'occupied', 'cleaning'] as const;
export type TableStatus = typeof tableStatuses[number];
export type TableRecord = {
    id: string;
    tableNumber: string;
    capacity: number;
    status: TableStatus;
    area: string;
};
export type TableInput = Omit<TableRecord, 'id'>;
export type QueueStatus = 'waiting' | 'called' | 'seated' | 'cancelled';
export type QueueRecord = {
    id: string;
    customerName: string;
    customerId: string;
    partySize: number;
    position: number;
    estimatedWaitMinutes: number;
    status: QueueStatus;
    joinedAtMillis: number;
    tableId?: string;
    tableNumber?: string;
};
export type KitchenAlert = {
    id: string;
    type: string;
    title: string;
    message: string;
    severity: string;
    acknowledged: boolean;
    createdAtMillis: number;
    reservationId?: string;
};

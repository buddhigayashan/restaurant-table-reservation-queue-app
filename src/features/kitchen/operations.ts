import type { QueueRecord, ReservationRecord, TableInput } from '@/types/operations';
import { tableStatuses } from '@/types/operations';
export function localDate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function arrivalMillis(record: ReservationRecord) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(record.time))
        return NaN;
    const [year, month, day] = record.date.split('-').map(Number);
    const [hour, minute] = record.time.split(':').map(Number);
    const date = new Date(year, month - 1, day, hour, minute);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date.getTime() : NaN;
}
export function activeReservation(record: ReservationRecord) {
    return ['confirmed', 'pending', 'reserved', 'arrived'].includes(record.status);
}
export function nextHour(records: ReservationRecord[], now = Date.now()) {
    return records.filter(record => activeReservation(record) && arrivalMillis(record) >= now && arrivalMillis(record) <= now + 60 * 60 * 1000);
}
export function orderedQueue(records: QueueRecord[]) {
    return records.filter(record => record.status === 'waiting' || record.status === 'called')
        .sort((a, b) => a.position - b.position || a.joinedAtMillis - b.joinedAtMillis || a.id.localeCompare(b.id));
}
export function validateTable(input: TableInput) {
    if (!/^[A-Za-z0-9-]{1,12}$/.test(input.tableNumber.trim()))
        throw new Error('Use a table number of up to 12 letters, digits or hyphens.');
    if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 100)
        throw new Error('Capacity must be a whole number from 1 to 100.');
    if (!input.area.trim() || input.area.length > 60)
        throw new Error('Enter an area of up to 60 characters.');
    if (!tableStatuses.includes(input.status))
        throw new Error('Select a valid table status.');
}
export function operationError(error: unknown) {
    const code = (error as {
        code?: string;
    })?.code;
    if (code === 'permission-denied')
        return 'Firestore access denied. Ask the project owner to provide the required staff/kitchen permissions.';
    if (code === 'unavailable')
        return 'Unable to connect. Check your internet connection.';
    return error instanceof Error ? error.message : 'Unable to complete this action.';
}

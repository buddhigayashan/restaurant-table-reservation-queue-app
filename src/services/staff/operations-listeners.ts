import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { assertSession, requireOperationsStaff } from './operations-access';
import type { FloorTable, OperationalQueueEntry, StaffAlert, StaffReservation } from '@/types/staff-operations';

type Data = Record<string, any>; // Firestore's schemaless DocumentData boundary.
export function readReservation(id: string, data: Data): StaffReservation {
  return { id, customerId: String(data.customerId || ''), customerName: String(data.customerName || 'Guest'), customerEmail: String(data.customerEmail || ''), phoneNumber: String(data.phoneNumber || ''),
    date: String(data.date || ''), time: String(data.time || ''), partySize: Number(data.partySize) || 0, seatingPreference: String(data.seatingPreference || 'No preference'), specialRequest: String(data.specialRequest || ''),
    status: String(data.status || 'unknown'), tableId: data.tableId ? String(data.tableId) : undefined, tableNumber: data.tableNumber != null ? String(data.tableNumber) : undefined,
    createdAtMillis: data.createdAt?.toMillis?.() || 0, activity: Array.isArray(data.activity) ? data.activity.map((item: Data) => ({ status: String(item.status || ''), atMillis: item.at?.toMillis?.() || 0 })) : [] };
}
function listener<T>(name: string, decode: (id: string, data: Data) => T) {
  return (uid: string, next: (rows: T[]) => void, fail: (error: Error) => void) => {
    let stopped = false; let unsubscribe = () => {};
    requireOperationsStaff().then(profile => {
      if (stopped) return;
      if (profile.uid !== uid) throw new Error('Your session changed.');
      unsubscribe = onSnapshot(collection(db, name), snapshot => {
        try { assertSession(uid); next(snapshot.docs.map(item => decode(item.id, item.data()))); }
        catch (error) { fail(error as Error); }
      }, fail);
    }).catch(error => { if (!stopped) fail(error); });
    return () => { stopped = true; unsubscribe(); };
  };
}
export const listenOperationalReservations = listener('reservations', readReservation);
export const listenFloorTables = listener<FloorTable>('tables', (id, data) => ({ id, tableNumber: String(data.tableNumber ?? ''), capacity: Number(data.capacity) || 0, status: String(data.status || 'unknown'), area: String(data.area || 'Main Floor'), reservationId: data.reservationId ? String(data.reservationId) : undefined }));
export const listenOperationalQueue = listener<OperationalQueueEntry>('queueEntries', (id, data) => ({ id, customerName: String(data.customerName || 'Guest'), partySize: Number(data.partySize) || 0, position: Number(data.position) || 0, status: String(data.status || ''), estimatedWaitMinutes: Number(data.estimatedWaitMinutes) || 0 }));
export const listenStaffAlerts = listener<StaffAlert>('staffAlerts', (id, data) => ({ id, type: String(data.type || 'notice'), title: String(data.title || 'Staff alert'), message: String(data.message || ''), severity: String(data.severity || 'info'), read: data.read === true, createdAtMillis: data.createdAt?.toMillis?.() || 0, reservationId: data.reservationId, queueEntryId: data.queueEntryId }));

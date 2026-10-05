import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { ReservationRecord } from '@/types/operations';
export function listenKitchenReservations(next: (records: ReservationRecord[]) => void, fail: (error: Error) => void) {
    return onSnapshot(collection(db, 'reservations'), snapshot => {
        const records = snapshot.docs.map(document => {
            const data = document.data();
            return {
                id: document.id, customerName: String(data.customerName || 'Guest'),
                date: String(data.date || ''), time: String(data.time || ''),
                partySize: Number(data.partySize) || 0, status: String(data.status || ''),
                seatingPreference: String(data.seatingPreference || ''), specialRequest: String(data.specialRequest || ''),
                tableId: data.tableId ? String(data.tableId) : undefined,
                tableNumber: data.tableNumber ? String(data.tableNumber) : undefined,
            };
        });
        next(records.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)));
    }, fail);
}

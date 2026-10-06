import { authorizeOperation, requireOperationsStaff } from '@/services/staff/operations-access';
import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { activeReservation, arrivalMillis } from '@/features/kitchen/operations';
import type { KitchenAlert, ReservationRecord } from '@/types/operations';
export function listenKitchenAlerts(next: (alerts: KitchenAlert[]) => void, fail: (error: Error) => void) {
    return onSnapshot(collection(db, 'kitchenAlerts'), snapshot => next(snapshot.docs.map(document => {
        const data = document.data();
        return { id: document.id, type: String(data.type || 'notice'), title: String(data.title || 'Kitchen alert'),
            message: String(data.message || ''), severity: String(data.severity || 'info'),
            acknowledged: data.acknowledged === true, createdAtMillis: data.createdAt?.toMillis?.() || 0,
            reservationId: data.reservationId };
    }).sort((a, b) => b.createdAtMillis - a.createdAtMillis)), fail);
}
export async function acknowledgeKitchenAlert(id: string) {
    const staff = await requireOperationsStaff(true);
    await runTransaction(db, async (transaction) => {
            await authorizeOperation(transaction, staff.uid, true);
        const reference = doc(db, 'kitchenAlerts', id);
        if (!(await transaction.get(reference)).exists())
            throw new Error('Alert no longer exists.');
        transaction.update(reference, { acknowledged: true, acknowledgedAt: serverTimestamp() });
    });
}
export async function generateLargePartyAlerts(records: ReservationRecord[]) {
    const staff = await requireOperationsStaff(true);
    // Explicit kitchen action; no background engine. One alert per reservation.
    const eligible = records.filter(record => activeReservation(record) && record.partySize >= 8 && arrivalMillis(record) >= Date.now());
    for (const record of eligible) {
        await runTransaction(db, async (transaction) => {
            await authorizeOperation(transaction, staff.uid, true);
            const reservation = await transaction.get(doc(db, 'reservations', record.id));
            const reference = doc(db, 'kitchenAlerts', `large-group-${record.id}`);
            const alert = await transaction.get(reference);
            if (!reservation.exists() || alert.exists())
                return;
            const latest = reservation.data();
            const current = { ...record, ...latest } as ReservationRecord;
            if (!activeReservation(current) || current.partySize < 8 || arrivalMillis(current) < Date.now())
                return;
            transaction.set(reference, { type: 'large_group', title: 'Large group arriving',
                message: `${current.customerName}: party of ${current.partySize} on ${current.date} at ${current.time}. ${current.specialRequest || ''}`,
                reservationId: record.id, severity: 'high', acknowledged: false, createdAt: serverTimestamp() });
        });
    }
}

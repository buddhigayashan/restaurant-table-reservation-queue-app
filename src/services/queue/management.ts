import { authorizeOperation, requireOperationsStaff } from '@/services/staff/operations-access';
import { collection, doc, getDocs, onSnapshot, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { orderedQueue } from '@/features/kitchen/operations';
import type { QueueRecord } from '@/types/operations';
function decode(id: string, data: Record<string, any>): QueueRecord {
    return { id, customerId: String(data.customerId || ''), customerName: String(data.customerName || 'Guest'),
        partySize: Number(data.partySize) || 0, position: Number(data.position) || 0,
        estimatedWaitMinutes: Number(data.estimatedWaitMinutes) || 0, status: data.status,
        joinedAtMillis: data.joinedAt?.toMillis?.() || 0, tableId: data.tableId, tableNumber: data.tableNumber };
}
const activeQuery = () => query(collection(db, 'queueEntries'), where('status', 'in', ['waiting', 'called']));
export function listenQueue(next: (entries: QueueRecord[]) => void, fail: (error: Error) => void) {
    return onSnapshot(activeQuery(), snapshot => next(orderedQueue(snapshot.docs.map(document => decode(document.id, document.data())))), fail);
}
export async function updateQueue(action: 'call' | 'seat' | 'cancel', id?: string, tableId?: string) {
    // Read the active IDs, then re-read them in a transaction so concurrent calls
    // cannot seat/call the same entry twice. New waiting entries join on next refresh.
    const staff = await requireOperationsStaff();
    const snapshot = await getDocs(activeQuery());
    if (snapshot.size > 400)
        throw new Error('Queue is too large for this operation. Contact the manager.');
    await runTransaction(db, async (transaction) => {
        await authorizeOperation(transaction, staff.uid);
        const orderRef = doc(db, 'queueState', 'order');
        const order = await transaction.get(orderRef);
        const ids = [...new Set([...snapshot.docs.map(item => item.id), ...(Array.isArray(order.data()?.activeIds) ? order.data()!.activeIds : [])])] as string[];
        if (ids.length > 400) throw new Error('Queue is too large for this operation.');
        const snapshots = await Promise.all(ids.map(id => transaction.get(doc(db, 'queueEntries', id))));
        const entries = orderedQueue(snapshots.filter(document => document.exists()).map(document => decode(document.id, document.data()!)));
        const entry = action === 'call' ? entries.find(item => item.status === 'waiting' && (!id || item.id === id)) : entries.find(item => item.id === id);
        if (!entry)
            throw new Error('No matching active queue entry. Refresh and try again.');
        if (action === 'call' && entries.some(item => item.status === 'called'))
            throw new Error('Seat or cancel the called customer before calling the next.');
        if (action === 'seat' && entry.status !== 'called')
            throw new Error('Call this customer before seating them.');
        if (action === 'seat' && (!Number.isInteger(entry.partySize) || entry.partySize < 1))
            throw new Error('This queue entry has an invalid party size. Ask the manager to correct it.');
        const assignedTableId = tableId || entry.tableId;
        const tableRef = action === 'seat' && assignedTableId ? doc(db, 'tables', assignedTableId) : null;
        const table = tableRef ? await transaction.get(tableRef) : null;
        if (tableRef && (!table?.exists() || table.data().status !== 'available' || table.data().reservationId || !Number.isInteger(Number(table.data().capacity)) || Number(table.data().capacity) < entry.partySize)) {
            throw new Error('Choose an available table with enough seats.');
        }
        const status = action === 'call' ? 'called' : action === 'seat' ? 'seated' : 'cancelled';
        const noticeRef = entry.customerId ? doc(db, 'customerNotifications', `${entry.id}-${status}`) : null;
        const notice = noticeRef ? await transaction.get(noticeRef) : null;
        transaction.update(doc(db, 'queueEntries', entry.id), {
            status, updatedAt: serverTimestamp(),
            ...(table?.exists() ? { tableId: assignedTableId, tableNumber: table.data().tableNumber } : {}),
        });
        if (tableRef)
            transaction.update(tableRef, { status: 'occupied', updatedAt: serverTimestamp() });
        if (noticeRef && !notice?.exists()) transaction.set(noticeRef, { customerId: entry.customerId, type: status === 'called' ? 'table_ready' : 'queue_update', title: status === 'called' ? 'Your table is ready' : status === 'seated' ? 'You have been seated' : 'Queue visit cancelled', message: status === 'called' ? 'Please head to the host stand.' : status === 'seated' ? 'Your queue visit is complete. Enjoy your meal!' : 'Please contact the host for assistance.', queueEntryId: entry.id, read: false, createdAt: serverTimestamp() });
        const remaining = entries.filter(item => item.id !== entry.id || action === 'call');
        transaction.set(orderRef, { activeIds: remaining.map(item => item.id), updatedAt: serverTimestamp() });
        remaining.forEach((item, index) => transaction.update(doc(db, 'queueEntries', item.id), { position: index + 1, estimatedWaitMinutes: (index + 1) * 5, updatedAt: serverTimestamp() }));
    });
}

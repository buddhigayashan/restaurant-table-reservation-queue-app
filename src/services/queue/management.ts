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
    const snapshot = await getDocs(activeQuery());
    if (snapshot.size > 400)
        throw new Error('Queue is too large for this operation. Contact the manager.');
    await runTransaction(db, async (transaction) => {
        const snapshots = await Promise.all(snapshot.docs.map(document => transaction.get(document.ref)));
        const entries = orderedQueue(snapshots.filter(document => document.exists()).map(document => decode(document.id, document.data()!)));
        const entry = action === 'call' ? entries.find(item => item.status === 'waiting') : entries.find(item => item.id === id);
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
        if (tableRef && (!table?.exists() || table.data().status !== 'available' || !Number.isInteger(Number(table.data().capacity)) || Number(table.data().capacity) < entry.partySize)) {
            throw new Error('Choose an available table with enough seats.');
        }
        const status = action === 'call' ? 'called' : action === 'seat' ? 'seated' : 'cancelled';
        transaction.update(doc(db, 'queueEntries', entry.id), {
            status, updatedAt: serverTimestamp(),
            ...(table?.exists() ? { tableId: assignedTableId, tableNumber: table.data().tableNumber } : {}),
        });
        if (tableRef)
            transaction.update(tableRef, { status: 'occupied', updatedAt: serverTimestamp() });
        const remaining = entries.filter(item => item.id !== entry.id || action === 'call');
        remaining.forEach((item, index) => transaction.update(doc(db, 'queueEntries', item.id), { position: index + 1, updatedAt: serverTimestamp() }));
    });
}

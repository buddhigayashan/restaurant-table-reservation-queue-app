import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { validateTable } from '@/features/kitchen/operations';
import { tableStatuses, type TableInput, type TableRecord } from '@/types/operations';
export function listenTables(next: (records: TableRecord[]) => void, fail: (error: Error) => void) {
    return onSnapshot(collection(db, 'tables'), snapshot => {
        try {
            const records: TableRecord[] = snapshot.docs.map(document => {
                const data = document.data();
                if (!tableStatuses.includes(data.status))
                    throw new Error('A table has an unsupported status. Correct its record before managing tables.');
                return { id: document.id, tableNumber: String(data.tableNumber || document.id), capacity: Number(data.capacity) || 0, status: data.status, area: String(data.area || 'Main Floor') };
            });
            next(records.sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true })));
        }
        catch (error) {
            fail(error instanceof Error ? error : new Error('Unable to read table records.'));
        }
    }, fail);
}
export async function saveTable(input: TableInput, id?: string) {
    validateTable(input);
    const normalized = { tableNumber: input.tableNumber.trim().toUpperCase(), capacity: input.capacity, status: input.status, area: input.area.trim() };
    const reference = doc(db, 'tables', id || normalized.tableNumber);
    await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (!id && snapshot.exists())
            throw new Error('That table number already exists.');
        if (id && !snapshot.exists())
            throw new Error('This table was removed. Refresh and try again.');
        if (id && snapshot.data()?.tableNumber !== normalized.tableNumber)
            throw new Error('Table numbers cannot be renamed here.');
        transaction.set(reference, {
            ...normalized, createdAt: snapshot.exists() ? snapshot.data().createdAt ?? serverTimestamp() : serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, { merge: true });
    });
}
export async function changeTableStatus(id: string, status: TableInput['status']) {
    if (!tableStatuses.includes(status))
        throw new Error('Invalid table status.');
    await runTransaction(db, async (transaction) => {
        const reference = doc(db, 'tables', id);
        if (!(await transaction.get(reference)).exists())
            throw new Error('Table no longer exists.');
        transaction.update(reference, { status, updatedAt: serverTimestamp() });
    });
}
export async function removeTable(id: string) {
    await runTransaction(db, async (transaction) => {
        const reference = doc(db, 'tables', id);
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists())
            throw new Error('Table no longer exists.');
        if (!['available', 'cleaning'].includes(snapshot.data().status))
            throw new Error('Only available or cleaning tables can be deleted.');
        transaction.delete(reference);
    });
}

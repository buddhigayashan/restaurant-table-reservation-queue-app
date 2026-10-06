import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { saveOperationalTable, deleteOperationalTable } from './staff-operations';
import { requireOperationsStaff } from '@/services/staff/operations-access';
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
// All table writes use the integrated reservation-aware service.
export async function saveTable(input: TableInput, id?: string) {
    return saveOperationalTable(input, id);
}
export async function changeTableStatus(id: string, status: TableInput['status']) {
    if (!tableStatuses.includes(status)) throw new Error('Invalid table status.');
    await requireOperationsStaff();
    const snapshot = await getDoc(doc(db, 'tables', id));
    if (!snapshot.exists()) throw new Error('Table no longer exists.');
    const data = snapshot.data();
    return saveOperationalTable({ tableNumber: String(data.tableNumber), capacity: Number(data.capacity), area: String(data.area || 'Main Floor'), status }, id);
}
export async function removeTable(id: string) { return deleteOperationalTable(id); }

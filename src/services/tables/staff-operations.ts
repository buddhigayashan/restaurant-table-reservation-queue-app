import { collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { assertSession, authorizeOperation, requireOperationsStaff } from '@/services/staff/operations-access';
import { validateTable } from '@/features/staff-operations/helpers';
import type { TableInput } from '@/types/staff-operations';

export async function saveOperationalTable(input: TableInput, id?: string) {
  validateTable(input);
  const staff = await requireOperationsStaff();
  const reference = id ? doc(db, 'tables', id) : doc(collection(db, 'tables'));
  const normalized = input.tableNumber.trim().toUpperCase();
  const registry = doc(db, 'tableNumbers', normalized);
  const existingNumbers = await getDocs(collection(db, 'tables'));
  const links = id ? await getDocs(query(collection(db, 'reservations'), where('tableId', '==', id))) : null;
  await runTransaction(db, async tx => {
    await authorizeOperation(tx, staff.uid);
    const current = await tx.get(reference);
    const number = await tx.get(registry);
    const oldNumber = current.exists() ? String(current.data().tableNumber).trim().toUpperCase() : '';
    const oldRegistry = oldNumber && oldNumber !== normalized ? await tx.get(doc(db, 'tableNumbers', oldNumber)) : null;
    const conflicts = await Promise.all(existingNumbers.docs.filter(item => item.id !== reference.id).map(item => tx.get(item.ref)));
    const reservations = links ? await Promise.all(links.docs.map(item => tx.get(item.ref))) : [];
    if (number.exists() && number.data().tableId !== reference.id || conflicts.some(item => item.exists() && String(item.data().tableNumber).trim().toUpperCase() === normalized)) throw new Error('That table number already exists.');
    if (id && !current.exists()) throw new Error('Table no longer exists.');
    if (current.exists() && current.data().reservationId && input.status !== current.data().status) throw new Error('Update the assigned reservation before changing this table status.');
    if (current.exists() && current.data().reservationId && input.capacity < Number(current.data().capacity)) throw new Error('Do not reduce the capacity of an assigned table.');
    const activeReservations = reservations.filter(item => item.exists() && ['pending', 'reserved', 'confirmed', 'arrived', 'seated'].includes(item.data()!.status));
    if (current.exists() && activeReservations.length && (input.status !== current.data().status || input.capacity < Math.max(...activeReservations.map(item => Number(item.data()!.partySize) || 0)))) throw new Error('Update the active reservation before changing its assigned table.');
    assertSession(staff.uid);
    tx.set(reference, { tableNumber: input.tableNumber.trim(), capacity: input.capacity, area: input.area.trim(), status: input.status, ...(!id ? { createdAt: serverTimestamp() } : {}), updatedAt: serverTimestamp() }, { merge: true });
    tx.set(registry, { tableId: reference.id });
    if (oldRegistry?.exists() && oldRegistry.data().tableId === reference.id) tx.delete(oldRegistry.ref);
    if (input.status === 'available' && current.exists() && current.data().status !== 'available') tx.set(doc(db, 'staffAlerts', `table-ready-${reference.id}`), { type: 'table_ready', title: 'Table ready', message: `Table ${input.tableNumber.trim()} is now available.`, severity: 'info', read: false, createdAt: serverTimestamp() });
  });
  return reference.id;
}
export async function deleteOperationalTable(id: string) {
  const staff = await requireOperationsStaff();
  const links = await getDocs(query(collection(db, 'reservations'), where('tableId', '==', id)));
  const queueLinks = await getDocs(query(collection(db, 'queueEntries'), where('tableId', '==', id)));
  await runTransaction(db, async tx => {
    await authorizeOperation(tx, staff.uid);
    const reference = doc(db, 'tables', id);
    const table = await tx.get(reference);
    if (!table.exists()) throw new Error('Table no longer exists.');
    const registry = await tx.get(doc(db, 'tableNumbers', String(table.data().tableNumber).trim().toUpperCase()));
    const reservations = await Promise.all(links.docs.map(item => tx.get(item.ref)));
    const queue = await Promise.all(queueLinks.docs.map(item => tx.get(item.ref)));
    if (table.data().reservationId || ['occupied', 'reserved'].includes(table.data().status) || reservations.some(item => item.exists() && ['pending', 'reserved', 'confirmed', 'arrived', 'seated'].includes(item.data()!.status)) || queue.some(item => item.exists() && ['waiting', 'called'].includes(item.data()!.status))) throw new Error('This table is in use. Release its active assignment before deleting it.');
    assertSession(staff.uid);
    tx.delete(reference);
    if (registry.exists() && registry.data().tableId === id) tx.delete(registry.ref);
  });
}

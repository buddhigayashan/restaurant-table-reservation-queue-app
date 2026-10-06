import { arrayUnion, collection, doc, getDocs, query, runTransaction, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { assertSession, authorizeOperation, requireOperationsStaff } from '@/services/staff/operations-access';
import { readReservation } from '@/services/staff/operations-listeners';
import { validateTransition } from '@/features/staff-operations/helpers';
import type { ReservationStatus } from '@/types/staff-operations';

export async function updateOperationalReservation(id: string, action: { status?: ReservationStatus; tableId?: string }) {
  if (!action.status && !action.tableId) throw new Error('Choose a status or table.');
  const staff = await requireOperationsStaff();
  // Existing records may have tableId but no table-side reservationId lock.
  const links = action.tableId ? await getDocs(query(collection(db, 'reservations'), where('tableId', '==', action.tableId))) : null;
  await runTransaction(db, async tx => {
    await authorizeOperation(tx, staff.uid);
    const reference = doc(db, 'reservations', id);
    const snapshot = await tx.get(reference);
    if (!snapshot.exists()) throw new Error('Reservation no longer exists.');
    const record = readReservation(id, snapshot.data());
    if (['completed', 'cancelled', 'no_show'].includes(record.status)) throw new Error('This reservation is already closed.');
    if (action.status) validateTransition(record, action.status);
    if (action.tableId && !['confirmed', 'reserved', 'pending', 'arrived', 'seated'].includes(record.status)) throw new Error('This reservation cannot be assigned a table.');
    const linked = links ? await Promise.all(links.docs.filter(item => item.id !== id).map(item => tx.get(item.ref))) : [];
    if (linked.some(item => item.exists() && ['confirmed', 'reserved', 'pending', 'arrived', 'seated'].includes(item.data()!.status))) throw new Error('That table is linked to another active reservation.');
    const nextTableId = action.tableId || record.tableId;
    const oldTable = record.tableId ? await tx.get(doc(db, 'tables', record.tableId)) : null;
    const newTable = nextTableId && nextTableId !== record.tableId ? await tx.get(doc(db, 'tables', nextTableId)) : oldTable;
    if (action.tableId || action.status === 'seated') {
      if (!newTable?.exists()) throw new Error('Assign an existing table before seating.');
      if (Number(newTable.data().capacity) < record.partySize) throw new Error('The table is too small for this party.');
      const ownsTable = newTable.id === record.tableId && (!newTable.data().reservationId || newTable.data().reservationId === id);
      if (newTable.data().reservationId && newTable.data().reservationId !== id) throw new Error('The table belongs to another reservation.');
      if (!ownsTable && newTable.data().status !== 'available') throw new Error('Choose an available table.');
      if (ownsTable && !['available', 'reserved', 'occupied'].includes(newTable.data().status)) throw new Error('The assigned table is not ready.');
    }
    if (oldTable?.exists() && oldTable.data().reservationId && oldTable.data().reservationId !== id) throw new Error('The old table belongs to another reservation.');
    const finalStatus = action.status || record.status;
    const closing = ['completed', 'cancelled', 'no_show'].includes(finalStatus);
    const readyReference = record.customerId && finalStatus === 'arrived' && nextTableId ? doc(db, 'customerNotifications', `${id}-table-ready-${nextTableId}`) : null;
    const existingReady = readyReference ? await tx.get(readyReference) : null;
    assertSession(staff.uid);
    if (oldTable?.exists() && (closing || nextTableId !== record.tableId)) {
      tx.update(oldTable.ref, { status: record.status === 'seated' || oldTable.data().status === 'occupied' ? 'cleaning' : 'available', reservationId: null, updatedAt: serverTimestamp() });
    }
    if (!closing && newTable?.exists() && (action.tableId || action.status === 'seated')) {
      tx.update(newTable.ref, { status: finalStatus === 'seated' ? 'occupied' : 'reserved', reservationId: id, updatedAt: serverTimestamp() });
    }
    tx.update(reference, { ...(action.status ? { status: action.status, activity: arrayUnion({ status: action.status, at: Timestamp.now(), staffUid: staff.uid }) } : {}),
      ...(action.tableId ? { tableId: action.tableId, tableNumber: String(newTable!.data()!.tableNumber) } : {}), updatedAt: serverTimestamp() });
    const changeId = action.status || `table-${action.tableId}`;
    const title = action.status ? `Reservation ${action.status.replace('_', ' ')}` : 'Table assigned';
    const message = `${record.customerName}: ${record.date} at ${record.time}, ${record.partySize} guests.`;
    tx.set(doc(db, 'staffAlerts', `${id}-${changeId}`), { type: action.status === 'cancelled' ? 'cancellation' : action.status === 'no_show' ? 'no_show' : 'reservation_changed', title, message, reservationId: id, severity: action.status === 'no_show' ? 'warning' : 'info', read: false, createdAt: serverTimestamp() });
    tx.set(doc(db, 'kitchenAlerts', `staff-${id}-${changeId}`), { type: action.status === 'cancelled' ? 'cancellation' : 'reservation_change', title, message, reservationId: id, severity: 'info', acknowledged: false, createdAt: serverTimestamp() });
    if (readyReference && !existingReady?.exists()) tx.set(readyReference, { customerId: record.customerId, type: 'table_ready', title: 'Your table is ready', message: 'Your assigned table is ready. Please speak to the restaurant team.', reservationId: id, read: false, createdAt: serverTimestamp() });
    if (record.customerId && action.status && !readyReference) tx.set(doc(db, 'customerNotifications', `staff-${id}-${action.status}`), { customerId: record.customerId, type: 'booking_changed', title, message, reservationId: id, read: false, createdAt: serverTimestamp() });
  });
}

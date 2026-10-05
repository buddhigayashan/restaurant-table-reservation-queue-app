import { collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { assertSession, authorizeOperation, requireOperationsStaff } from '@/services/staff/operations-access';
import { estimateWalkInQueue, validateWalkIn } from '@/features/staff-operations/helpers';
import type { WalkInInput } from '@/types/staff-operations';

export async function registerWalkIn(input: WalkInInput) {
  validateWalkIn(input);
  const staff = await requireOperationsStaff();
  const existing = await getDocs(query(collection(db, 'queueEntries'), where('status', 'in', ['waiting', 'called'])));
  const reference = doc(collection(db, 'queueEntries'));
  const orderRef = doc(db, 'queueState', 'order');
  const estimate = await runTransaction(db, async tx => {
    await authorizeOperation(tx, staff.uid);
    const order = await tx.get(orderRef);
    const ids = [...new Set([...existing.docs.map(item => item.id), ...(Array.isArray(order.data()?.activeIds) ? order.data()!.activeIds : [])])] as string[];
    if (ids.length > 400) throw new Error('Queue is busy. Please retry later.');
    const entries = await Promise.all(ids.map(id => tx.get(doc(db, 'queueEntries', id))));
    const active = entries.filter(item => item.exists() && ['waiting', 'called'].includes(item.data()!.status));
    if (active.length >= 200) throw new Error('Queue is busy. Please retry later.');
    const estimate = estimateWalkInQueue(active.map(item => ({ status: String(item.data()!.status), position: Number(item.data()!.position) || 0 })));
    assertSession(staff.uid);
    tx.set(reference, { customerId: null, customerName: input.customerName.trim(), phoneNumber: input.phoneNumber.trim(), partySize: input.partySize, seatingPreference: input.seatingPreference,
      ...estimate, status: 'waiting', source: 'walk_in', joinedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    // Same serialization guard as Vimandya customer joins; no customer auth needed.
    tx.set(orderRef, { activeIds: [...active.map(item => item.id), reference.id], updatedAt: serverTimestamp() });
    if (input.partySize >= 8 || active.length >= 4) tx.set(doc(db, 'staffAlerts', `walk-in-${reference.id}`), { type: input.partySize >= 8 ? 'large_group' : 'rush', title: input.partySize >= 8 ? 'Large group walk-in' : 'Queue building up', message: `${input.customerName.trim()}: ${input.partySize} guests. ${active.length + 1} active parties.`, queueEntryId: reference.id, severity: 'warning', read: false, createdAt: serverTimestamp() });
    return estimate;
  });
  return { id: reference.id, ...estimate };
}

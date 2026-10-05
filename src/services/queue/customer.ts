import { collection, doc, getDocs, onSnapshot, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { checkSession, requireCustomer } from '@/services/auth/module-access';
import { validateQueue } from '@/features/vimandya/validation';
import type { CustomerQueueEntry, QueueInput } from '@/types/vimandya';

const active = (status: string) => status === 'waiting' || status === 'called';
export function listenOwnQueue(uid: string, next: (rows: CustomerQueueEntry[]) => void, fail: (error: Error) => void) {
  try { checkSession(uid); } catch (error) { fail(error as Error); return () => {}; }
  return onSnapshot(query(collection(db, 'queueEntries'), where('customerId', '==', uid)), snapshot => {
    try { checkSession(uid); } catch (error) { fail(error as Error); return; }
    next(snapshot.docs.map(item => {
      const data = item.data();
      return { id: item.id, customerId: uid, customerName: String(data.customerName || ''), phoneNumber: String(data.phoneNumber || ''), partySize: Number(data.partySize) || 0,
        seatingPreference: String(data.seatingPreference || 'No preference'), position: Number(data.position) || 0,
        estimatedWaitMinutes: Number(data.estimatedWaitMinutes) || 0, status: data.status as CustomerQueueEntry['status'], joinedAtMillis: data.joinedAt?.toMillis?.() || 0 };
    }).sort((a, b) => Number(active(b.status)) - Number(active(a.status)) || b.joinedAtMillis - a.joinedAtMillis));
  }, fail);
}
export function listenQueueEstimate(uid: string, next: (rows: number[]) => void, fail: (error: Error) => void) {
  try { checkSession(uid); } catch (error) { fail(error as Error); return () => {}; }
  return onSnapshot(query(collection(db, 'queueEntries'), where('status', 'in', ['waiting', 'called'])), snapshot => {
    try { checkSession(uid); } catch (error) { fail(error as Error); return; }
    next([snapshot.size]);
  }, fail);
}
export async function joinCustomerQueue(input: QueueInput) {
  validateQueue(input);
  const { uid } = await requireCustomer();
  // Existing operational/walk-in entries are included without changing their schema.
  const snapshot = await getDocs(query(collection(db, 'queueEntries'), where('status', 'in', ['waiting', 'called'])));
  const entryRef = doc(collection(db, 'queueEntries'));
  const orderRef = doc(db, 'queueState', 'order');
  const customerRef = doc(db, 'queueState', `customer-${uid}`);
  await runTransaction(db, async tx => {
    const order = await tx.get(orderRef);
    const customer = await tx.get(customerRef);
    const ids = [...new Set([...snapshot.docs.map(item => item.id), ...(Array.isArray(order.data()?.activeIds) ? order.data()!.activeIds : []), ...(customer.data()?.entryId ? [customer.data()!.entryId] : [])])] as string[];
    if (ids.length > 400) throw new Error('The queue is busy. Please contact the host.');
    const entries = await Promise.all(ids.map(id => tx.get(doc(db, 'queueEntries', id))));
    checkSession(uid);
    const current = entries.filter(item => item.exists() && active(item.data()!.status));
    if (current.length >= 200) throw new Error('The queue is busy. Please contact the host.');
    if (current.some(item => item.data()!.customerId === uid)) throw new Error('You already have an active queue entry. Open Your queue to view it.');
    const position = current.reduce((max, item) => Math.max(max, Number(item.data()!.position) || 0), 0) + 1;
    tx.set(entryRef, { customerId: uid, customerName: input.customerName.trim(), phoneNumber: input.phoneNumber.trim(), partySize: input.partySize,
      seatingPreference: input.seatingPreference, position, estimatedWaitMinutes: position * 5, status: 'waiting', joinedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    // Shared serial transaction and per-customer guard prevent concurrent duplicates.
    tx.set(orderRef, { activeIds: [...current.map(item => item.id), entryRef.id], updatedAt: serverTimestamp() });
    tx.set(customerRef, { entryId: entryRef.id, updatedAt: serverTimestamp() });
    tx.set(doc(db, 'customerNotifications', `${entryRef.id}-waiting`), { customerId: uid, type: 'queue_update', title: 'You joined the queue', message: `Position ${position}. Initial estimate: ${position * 5} minutes.`, queueEntryId: entryRef.id, read: false, createdAt: serverTimestamp() });
  });
  return entryRef.id;
}
export async function leaveCustomerQueue(id: string) {
  const { uid } = await requireCustomer();
  await runTransaction(db, async tx => {
    const reference = doc(db, 'queueEntries', id);
    const entry = await tx.get(reference);
    checkSession(uid);
    if (!entry.exists() || entry.data().customerId !== uid) throw new Error('Queue entry does not belong to your account.');
    if (entry.data().status === 'cancelled') return;
    if (!active(entry.data().status)) throw new Error('This queue visit is already complete.');
    tx.update(reference, { status: 'cancelled', updatedAt: serverTimestamp() });
    tx.set(doc(db, 'customerNotifications', `${id}-cancelled`), { customerId: uid, type: 'queue_update', title: 'You left the queue', message: 'Your queue entry has been cancelled.', queueEntryId: id, read: false, createdAt: serverTimestamp() });
  });
}

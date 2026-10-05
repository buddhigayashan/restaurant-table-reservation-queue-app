import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { checkSession, requireCustomer } from '@/services/auth/module-access';
import type { CustomerNotice } from '@/types/vimandya';

export function listenCustomerNotifications(uid: string, next: (rows: CustomerNotice[]) => void, fail: (error: Error) => void) {
  try { checkSession(uid); } catch (error) { fail(error as Error); return () => {}; }
  return onSnapshot(query(collection(db, 'customerNotifications'), where('customerId', '==', uid)), snapshot => {
    try { checkSession(uid); } catch (error) { fail(error as Error); return; }
    next(snapshot.docs.map(item => {
      const data = item.data();
      return { id: item.id, customerId: uid, type: String(data.type || 'notice'), title: String(data.title || 'Notification'), message: String(data.message || ''),
        read: data.read === true, createdAtMillis: data.createdAt?.toMillis?.() || 0, reservationId: data.reservationId, queueEntryId: data.queueEntryId };
    }).sort((a, b) => b.createdAtMillis - a.createdAtMillis));
  }, fail);
}
export async function markNoticesRead(ids: string[]) {
  const { uid } = await requireCustomer();
  // Small transactions keep ownership checks and writes together; retry is safe.
  for (const id of [...new Set(ids)]) {
    await runTransaction(db, async tx => {
      const reference = doc(db, 'customerNotifications', id);
      const notice = await tx.get(reference);
      checkSession(uid);
      if (!notice.exists() || notice.data().customerId !== uid) throw new Error('Notification does not belong to your account.');
      if (!notice.data().read) tx.update(reference, { read: true });
    });
  }
}
export async function ensureQueueStatusNotice(id: string) {
  const { uid } = await requireCustomer();
  await runTransaction(db, async tx => {
    const entry = await tx.get(doc(db, 'queueEntries', id));
    checkSession(uid);
    if (!entry.exists() || entry.data().customerId !== uid) throw new Error('Queue entry does not belong to your account.');
    const status = entry.data().status;
    if (!['called', 'seated'].includes(status)) return;
    const reference = doc(db, 'customerNotifications', `${id}-${status}`);
    if ((await tx.get(reference)).exists()) return;
    tx.set(reference, { customerId: uid, type: status === 'called' ? 'table_ready' : 'queue_update',
      title: status === 'called' ? 'Your table is ready' : 'You have been seated',
      message: status === 'called' ? 'Please head to the host stand.' : 'Your queue visit is complete. Enjoy your meal!',
      queueEntryId: id, read: false, createdAt: serverTimestamp() });
  });
}

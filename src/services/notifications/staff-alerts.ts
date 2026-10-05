import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { assertSession, authorizeOperation, requireOperationsStaff } from '@/services/staff/operations-access';

export async function readStaffAlerts(ids: string[]) {
  const staff = await requireOperationsStaff();
  // Each transaction validates the current role and is safe to repeat.
  for (const id of [...new Set(ids)]) await runTransaction(db, async tx => {
    await authorizeOperation(tx, staff.uid);
    const reference = doc(db, 'staffAlerts', id);
    const alert = await tx.get(reference);
    if (!alert.exists()) throw new Error('Alert no longer exists.');
    assertSession(staff.uid);
    if (alert.data().read !== true) tx.update(reference, { read: true });
  });
}

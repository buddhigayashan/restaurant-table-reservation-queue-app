import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { checkSession, currentUid, decodeStaff, requireStaff } from '@/services/auth/module-access';
import { validateStaff } from '@/features/vimandya/validation';
import type { StaffProfile } from '@/types/vimandya';

export async function staffLogin(email: string, password: string) {
  if (!email.trim() || !password) throw new Error('Enter your staff email and password.');
  await signInWithEmailAndPassword(auth, email.trim(), password);
  try { return await requireStaff(); }
  catch (error) { await signOut(auth); throw error; }
}
export async function resetStaffPassword(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Enter your staff email first.');
  await sendPasswordResetEmail(auth, email.trim());
}
export function listenStaffAccounts(uid: string, next: (rows: StaffProfile[]) => void, fail: (error: Error) => void) {
  let stop = () => {}; let disposed = false;
  requireStaff(true).then(profile => {
    if (disposed) return;
    if (profile.uid !== uid) throw new Error('Your session changed.');
    stop = onSnapshot(collection(db, 'staffAccounts'), snapshot => {
      try { checkSession(uid); next(snapshot.docs.map(item => decodeStaff(item.id, item.data())).sort((a, b) => a.fullName.localeCompare(b.fullName))); }
      catch (error) { fail(error as Error); }
    }, fail);
  }).catch(error => { if (!disposed) fail(error); });
  return () => { disposed = true; stop(); };
}
export async function saveStaffProfile(input: StaffProfile, creating = false) {
  validateStaff(input);
  const manager = await requireStaff(true);
  const profile = { uid: input.uid.trim(), fullName: input.fullName.trim(), email: input.email.trim().toLowerCase(), role: input.role, isActive: input.isActive };
  await runTransaction(db, async tx => {
    const managerSnapshot = await tx.get(doc(db, 'staffAccounts', manager.uid));
    const reference = doc(db, 'staffAccounts', profile.uid);
    const existing = await tx.get(reference);
    checkSession(manager.uid);
    if (!managerSnapshot.exists() || managerSnapshot.data().role !== 'manager' || managerSnapshot.data().isActive !== true) throw new Error('Active manager access is required.');
    if (creating && existing.exists()) throw new Error('That staff UID already has a profile. Use Edit.');
    if (!creating && !existing.exists()) throw new Error('Staff profile no longer exists.');
    if (profile.uid === manager.uid && (!profile.isActive || profile.role !== 'manager')) throw new Error('You cannot deactivate or demote your own manager account.');
    if (profile.uid === currentUid() && profile.email !== auth.currentUser?.email?.toLowerCase()) throw new Error('Your manager email must match Authentication.');
    // Profile metadata only. This does not create an Authentication user/password.
    tx.set(reference, { ...profile, ...(creating ? { createdAt: serverTimestamp() } : {}), updatedAt: serverTimestamp() }, { merge: true });
  });
}

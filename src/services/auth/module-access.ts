import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { staffRoles, type StaffProfile } from '@/types/vimandya';

export function currentUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Please sign in to continue.');
  return uid;
}
export function checkSession(uid: string) {
  if (auth.currentUser?.uid !== uid) throw new Error('Your session changed. Please try again.');
}
export function decodeStaff(uid: string, data: Record<string, unknown>): StaffProfile {
  if (!staffRoles.includes(data.role as StaffProfile['role']) || data.uid !== uid) throw new Error('No valid staff profile found.');
  return { uid, fullName: String(data.fullName || ''), email: String(data.email || ''), role: data.role as StaffProfile['role'], isActive: data.isActive === true };
}
export async function requireCustomer() {
  const uid = currentUid();
  const profile = await getDoc(doc(db, 'users', uid));
  checkSession(uid);
  if (!profile.exists() || profile.data().role !== 'customer') throw new Error('An authenticated customer profile is required.');
  return { ...profile.data(), uid };
}
export async function requireStaff(managerOnly = false) {
  const uid = currentUid();
  const snapshot = await getDoc(doc(db, 'staffAccounts', uid));
  checkSession(uid);
  if (!snapshot.exists()) throw new Error('No staff profile exists for this account.');
  const profile = decodeStaff(uid, snapshot.data());
  if (!profile.isActive) throw new Error('This staff account is inactive. Contact the manager.');
  if (profile.email.toLowerCase() !== auth.currentUser?.email?.toLowerCase()) throw new Error('Staff profile email does not match the signed-in account.');
  if (managerOnly && profile.role !== 'manager') throw new Error('Only an active manager can manage staff accounts.');
  return profile;
}

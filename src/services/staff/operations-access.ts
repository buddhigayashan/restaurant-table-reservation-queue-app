import { doc, getDoc, type Transaction } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { StaffMember } from '@/types/staff-operations';

export function assertSession(uid: string) {
  if (auth.currentUser?.uid !== uid) throw new Error('Your session changed. Sign in again.');
}
export function parseStaff(uid: string, data: Record<string, unknown>): StaffMember {
  if (data.uid !== uid || !['manager', 'staff', 'kitchen'].includes(String(data.role))) throw new Error('No valid staff profile exists.');
  return { uid, fullName: String(data.fullName || ''), email: String(data.email || ''), role: data.role as StaffMember['role'], isActive: data.isActive === true };
}
function validateAccess(uid: string, data: Record<string, unknown>, profileOnly: boolean) {
  assertSession(uid);
  const profile = parseStaff(uid, data);
  if (!profile.isActive || profile.email.toLowerCase() !== auth.currentUser?.email?.toLowerCase()) throw new Error('An active matching staff profile is required.');
  if (!profileOnly && !['staff', 'manager'].includes(profile.role)) throw new Error('Staff or manager access is required for restaurant operations.');
  return profile;
}
export async function requireOperationsStaff(profileOnly = false) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Please sign in with a staff account.');
  const snapshot = await getDoc(doc(db, 'staffAccounts', uid));
  if (!snapshot.exists()) throw new Error('No staff profile exists for this account.');
  return validateAccess(uid, snapshot.data(), profileOnly);
}
export async function authorizeOperation(tx: Transaction, uid: string, profileOnly = false) {
  const profile = await tx.get(doc(db, 'staffAccounts', uid));
  if (!profile.exists()) throw new Error('No staff profile exists.');
  return validateAccess(uid, profile.data(), profileOnly);
}

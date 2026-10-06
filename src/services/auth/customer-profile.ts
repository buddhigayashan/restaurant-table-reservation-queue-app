import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword, updateProfile } from 'firebase/auth';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { checkSession, requireCustomer } from './module-access';
export type NotificationPreferences = { bookingUpdates: boolean; queueUpdates: boolean };
export function decodePreferences(data: Record<string, unknown> = {}): NotificationPreferences {
  if (!data || typeof data !== 'object') data = {};
  return { bookingUpdates: data.bookingUpdates !== false, queueUpdates: data.queueUpdates !== false };
}
export async function updateCustomerDetails(fullName: string, phoneNumber: string) {
  const profile = await requireCustomer();
  if (fullName.trim().length < 2 || fullName.trim().length > 100) throw new Error('Enter a full name between 2 and 100 characters.');
  if (!/^\+?[\d\s()-]{7,20}$/.test(phoneNumber.trim()) || phoneNumber.replace(/\D/g, '').length < 7) throw new Error('Enter a valid phone number.');
  await runTransaction(db, async tx => {
    const ref = doc(db, 'users', profile.uid); const current = await tx.get(ref);
    checkSession(profile.uid);
    if (!current.exists() || current.data().role !== 'customer') throw new Error('Customer access is required.');
    tx.update(ref, { fullName: fullName.trim(), phoneNumber: phoneNumber.trim(), updatedAt: serverTimestamp() });
  });
  if (auth.currentUser?.uid === profile.uid) await updateProfile(auth.currentUser, { displayName: fullName.trim() }).catch(() => undefined);
}
export async function changeCustomerPassword(currentPassword: string, password: string, confirmation: string) {
  const { uid } = await requireCustomer(); const user = auth.currentUser;
  if (!user?.email || user.uid !== uid) throw new Error('Sign in again before changing your password.');
  if (!currentPassword) throw new Error('Enter your current password.');
  if (password.length < 8) throw new Error('Use at least 8 characters for your new password.');
  if (password !== confirmation) throw new Error('New passwords do not match.');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  checkSession(uid); await updatePassword(user, password);
}
export async function saveNotificationPreferences(preferences: NotificationPreferences) {
  const { uid } = await requireCustomer();
  await runTransaction(db, async tx => {
    const ref = doc(db, 'users', uid); const profile = await tx.get(ref); checkSession(uid);
    if (!profile.exists() || profile.data().role !== 'customer') throw new Error('Customer access is required.');
    tx.update(ref, { notificationPreferences: { bookingUpdates: preferences.bookingUpdates === true, queueUpdates: preferences.queueUpdates === true }, updatedAt: serverTimestamp() });
  });
}
export async function logout() { await signOut(auth); }

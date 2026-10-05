import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '@/config/firebase';
import { validateEmail, validateSignUp } from '@/features/customer/validation';
import type { CustomerProfile, CustomerSignUpInput } from '@/types/customer';

export async function getCustomerProfile(uid: string): Promise<CustomerProfile | null> {
  if (auth.currentUser?.uid !== uid) {
    throw new Error('Log in to view your customer profile.');
  }
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (data.role !== 'customer') throw new Error('Use a customer account to continue.');
  return {
    uid,
    fullName: typeof data.fullName === 'string' ? data.fullName : '',
    email: typeof data.email === 'string' ? data.email : '',
    phoneNumber: typeof data.phoneNumber === 'string' ? data.phoneNumber : '',
    role: 'customer',
    createdAt: data.createdAt ?? null,
  };
}

export async function signUpCustomer(input: CustomerSignUpInput): Promise<void> {
  const validationError = validateSignUp(input);
  if (validationError) throw new Error(validationError);
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const { user } = await createUserWithEmailAndPassword(auth, email, input.password);
  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      fullName,
      email,
      phoneNumber: input.phoneNumber.trim(),
      role: 'customer',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Auth and Firestore are separate services. Remove the new Auth account
    // if its profile could not be saved, so the customer can retry sign-up.
    try {
      await deleteUser(user);
    } catch {
      await signOut(auth);
      throw new Error(
        'Your account was created, but its profile could not be saved. Contact the restaurant before trying again.'
      );
    }
    throw error;
  }
  // Display-name updates are optional; the Firestore profile is authoritative.
  await updateProfile(user, { displayName: fullName }).catch(() => undefined);
}

export async function loginCustomer(email: string, password: string): Promise<void> {
  const validationError = validateEmail(email);
  if (validationError) throw new Error(validationError);
  if (!password) throw new Error('Enter your password.');
  const { user } = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  try {
    const profile = await getCustomerProfile(user.uid);
    if (!profile) throw new Error('Your customer profile is missing. Contact the restaurant.');
  } catch (error) {
    await signOut(auth);
    throw error;
  }
}

export async function resetCustomerPassword(email: string): Promise<void> {
  const validationError = validateEmail(email);
  if (validationError) throw new Error(validationError);
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

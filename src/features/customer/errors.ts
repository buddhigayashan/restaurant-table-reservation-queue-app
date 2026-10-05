import { FirebaseError } from 'firebase/app';

const messages: Record<string, string> = {
  'auth/email-already-in-use': 'This email already has an account. Log in instead.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'Choose a stronger password.',
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/user-not-found': 'The email or password is incorrect.',
  'auth/wrong-password': 'The email or password is incorrect.',
  'auth/user-disabled': 'This account is disabled. Contact the restaurant.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Check your internet connection and try again.',
  'auth/operation-not-allowed': 'Email/password sign-in is unavailable. Contact the restaurant.',
  'permission-denied': 'You do not have permission for this action. Contact the restaurant.',
  'unavailable': 'The service is unavailable. Check your connection and try again.',
};

export function customerErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return messages[error.code] ?? 'Unable to complete this action. Please try again.';
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

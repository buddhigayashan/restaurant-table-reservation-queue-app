import { getApp, getApps, initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingFields = Object.entries(firebaseConfig)
  .filter(([, value]) => !value?.trim())
  .map(([field]) => field);

if (missingFields.length > 0) {
  throw new Error(
    `Missing Firebase configuration: ${missingFields.join(', ')}. Fill in .env using .env.example and restart Expo.`
  );
}

// Reuse the default app during Fast Refresh.
export const app = getApps().some((existingApp) => existingApp.name === '[DEFAULT]')
  ? getApp()
  : initializeApp(firebaseConfig);

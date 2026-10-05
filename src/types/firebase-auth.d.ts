import type AsyncStorage from '@react-native-async-storage/async-storage';
import type { Persistence } from 'firebase/auth';

// Firebase 12 exposes this function at runtime on React Native, but its
// public TypeScript entry omits the native export. Match the SDK signature.
declare module 'firebase/auth' {
  export function getReactNativePersistence(
    storage: Pick<typeof AsyncStorage, 'getItem' | 'setItem' | 'removeItem'>
  ): Persistence;
}

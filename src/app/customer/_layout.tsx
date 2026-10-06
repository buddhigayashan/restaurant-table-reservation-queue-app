import { Stack } from 'expo-router';
import { AreaGuard } from '@/features/auth/session';

export default function AreaLayout() {
  return <AreaGuard area="customer"><Stack screenOptions={{ headerShown: false }} /></AreaGuard>;
}


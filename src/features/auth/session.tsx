import { palette } from '@/constants/restaurant-theme';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { Redirect, useSegments } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { auth, db } from '@/config/firebase';
import { canOpenArea, roleDestination, type AppRole } from './access';
import { SafeAreaView } from 'react-native-safe-area-context';

type Session = { uid: string | null; role: AppRole | null; loading: boolean; error: string };
const Context = createContext<Session>({ uid: null, role: null, loading: true, error: '' });
export const useSession = () => useContext(Context);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session>({ uid: null, role: null, loading: true, error: '' });
  useEffect(() => {
    let stops: (() => void)[] = [];
    const stop = onAuthStateChanged(auth, user => {
      stops.forEach(unsubscribe => unsubscribe()); stops = [];
      setSession({ uid: user?.uid || null, role: null, loading: !!user, error: '' });
      if (!user) return;
      let customer: AppRole | null = null;
      let staff: AppRole | null = null;
      let customerReady = false; let staffReady = false;
      let customerError = ''; let staffError = '';
      const publish = () => {
        if (auth.currentUser?.uid !== user.uid) return;
        const role = staff || customer;
        setSession({ uid: user.uid, role, loading: !(customerReady && staffReady), error: role ? '' : customerError || staffError || 'No valid active account profile was found.' });
      };
      stops.push(onSnapshot(doc(db, 'users', user.uid), snapshot => {
        customer = snapshot.exists() && snapshot.data().role === 'customer' ? 'customer' : null;
        customerReady = true; customerError = ''; publish();
      }, error => { customerReady = true; customer = null; customerError = error.message; publish(); }));
      stops.push(onSnapshot(doc(db, 'staffAccounts', user.uid), snapshot => {
        const data = snapshot.data();
        staff = data && data.uid === user.uid && data.isActive === true && String(data.email).toLowerCase() === user.email?.toLowerCase() && ['manager', 'staff', 'kitchen'].includes(data.role) ? data.role : null;
        staffReady = true; staffError = ''; publish();
      }, error => { staffReady = true; staff = null; staffError = error.message; publish(); }));
    });
    return () => { stops.forEach(unsubscribe => unsubscribe()); stop(); };
  }, []);
  return <Context.Provider value={session}>{children}</Context.Provider>;
}

export function AreaGuard({ area, children }: PropsWithChildren<{ area: 'customer' | 'staff' | 'kitchen' }>) {
  const session = useSession();
  const [signOutError, setSignOutError] = useState('');
  const segments = useSegments();
  const route = String(segments[segments.length - 1]);
  const publicRoute = area === 'customer' ? ['index', 'onboarding', 'login', 'sign-up', 'reset-password'].includes(route) : area === 'staff' && route === 'login';
  if (publicRoute && !session.loading && session.role) return <Redirect href={roleDestination(session.role)} />;
  if (publicRoute && !session.loading) return children;
  if (session.loading) return <SafeAreaView style={{ flex: 1, justifyContent: 'center', backgroundColor: palette.cream }}><View style={{ alignItems: 'center', gap: 12 }}><ActivityIndicator color="#111" /><Text>Checking your account…</Text></View></SafeAreaView>;
  if (!session.uid) return <Redirect href={area === 'customer' ? '/customer/login' : '/staff/login'} />;
  if (!session.role) return <SafeAreaView style={{ flex: 1, padding: 24, gap: 16, backgroundColor: palette.cream }}><Text>{signOutError || session.error}</Text><Pressable accessibilityRole="button" onPress={() => { void signOut(auth).catch(error => setSignOutError(error.message)); }} style={{ padding: 16, backgroundColor: palette.primary, borderRadius: 12 }}><Text style={{ color: '#fff', textAlign: 'center' }}>Sign out and try again</Text></Pressable></SafeAreaView>;
  if (!canOpenArea(session.role, area, route)) return <Redirect href={roleDestination(session.role)} />;
  return children;
}

import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '@/config/firebase';
import { getCustomerProfile } from '@/services/auth/customer';
import type { CustomerProfile } from '@/types/customer';
import { customerErrorMessage } from '../errors';

export function useCustomer() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let version = 0;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const request = ++version;
      setUser(currentUser); setProfile(null); setError(''); setLoading(true);
      try {
        const result = currentUser ? await getCustomerProfile(currentUser.uid) : null;
        if (active && request === version) setProfile(result);
      } catch (err) {
        if (active && request === version) setError(customerErrorMessage(err));
      } finally {
        if (active && request === version) setLoading(false);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, []);
  return { user, profile, loading, error };
}

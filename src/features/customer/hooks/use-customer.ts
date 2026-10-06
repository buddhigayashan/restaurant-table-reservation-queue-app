import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';

import type { CustomerProfile } from '@/types/customer';
import { customerErrorMessage } from '../errors';

export function useCustomer() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let stopProfile = () => {};
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      stopProfile(); setUser(currentUser); setProfile(null); setError(''); setLoading(!!currentUser);
      if (!currentUser) return;
      stopProfile = onSnapshot(doc(db, 'users', currentUser.uid), snapshot => {
        if (auth.currentUser?.uid !== currentUser.uid) return;
        const data = snapshot.data();
        if (!data || data.role !== 'customer') { setProfile(null); setError('A customer profile is required.'); setLoading(false); return; }
        setProfile({ uid: currentUser.uid, fullName: String(data.fullName || ''), email: String(data.email || ''), phoneNumber: String(data.phoneNumber || ''), role: 'customer', createdAt: data.createdAt ?? null, notificationPreferences: data.notificationPreferences });
        setError(''); setLoading(false);
      }, err => { setProfile(null); setError(customerErrorMessage(err)); setLoading(false); });
    });
    return () => { stopProfile(); unsubscribe(); };
  }, []);
  return { user, profile, loading, error };
}

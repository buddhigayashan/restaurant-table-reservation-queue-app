import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { friendlyError } from './validation';
import { decodeStaff } from '@/services/auth/module-access';

export function useModuleAccess(area: 'customer' | 'manager') {
  const [state, setState] = useState<{ uid: string | null; loading: boolean; error: string; name: string; phone: string }>({ uid: null, loading: true, error: '', name: '', phone: '' });
  useEffect(() => {
    let stopProfile = () => {};
    const stopAuth = onAuthStateChanged(auth, user => {
      stopProfile();
      setState({ uid: null, loading: !!user, error: user ? '' : 'Please sign in to continue.', name: '', phone: '' });
      if (!user) return;
      stopProfile = onSnapshot(doc(db, area === 'customer' ? 'users' : 'staffAccounts', user.uid), snapshot => {
        if (auth.currentUser?.uid !== user.uid) return;
        try {
          if (!snapshot.exists()) throw new Error('No account profile found. Contact the restaurant.');
          const data = snapshot.data();
          if (area === 'customer' && data.role !== 'customer') throw new Error('Customer access is required.');
          if (area === 'manager') {
            const profile = decodeStaff(user.uid, data);
            if (!profile.isActive || profile.role !== 'manager' || profile.email.toLowerCase() !== user.email?.toLowerCase()) throw new Error('Only an active manager can manage staff accounts.');
          }
          setState({ uid: user.uid, loading: false, error: '', name: String(data.fullName || ''), phone: String(data.phoneNumber || '') });
        } catch (error) { setState({ uid: null, loading: false, error: friendlyError(error), name: '', phone: '' }); }
      }, error => setState({ uid: null, loading: false, error: friendlyError(error), name: '', phone: '' }));
    });
    return () => { stopProfile(); stopAuth(); };
  }, [area]);
  return state;
}
export function useRecords<T>(uid: string | null, listen: (uid: string, next: (rows: T[]) => void, fail: (error: Error) => void) => () => void) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ owner: string | null; rows: T[]; loading: boolean; error: string }>({ owner: null, rows: [], loading: true, error: '' });
  useEffect(() => {
    if (!uid) return;
    let active = true;
    const fail = (error: Error) => { if (active) setResult({ owner: uid, rows: [], loading: false, error: friendlyError(error) }); };
    let stop = () => {};
    try { stop = listen(uid, rows => { if (active) setResult({ owner: uid, rows, loading: false, error: '' }); }, fail); } catch (error) { fail(error as Error); }
    return () => { active = false; stop(); };
  }, [uid, listen, version]);
  const visible = uid && result.owner === uid ? result : { rows: [] as T[], loading: !!uid, error: '' };
  return { ...visible, retry: () => { setResult({ owner: uid, rows: [], loading: true, error: '' }); setVersion(value => value + 1); } };
}
export function useTask() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function run(action: () => Promise<string | void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try { setMessage((await action()) || ''); } catch (error) { setError(friendlyError(error)); }
    finally { lock.current = false; setBusy(false); }
  }
  return { run, busy, error, message };
}
export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  return now;
}

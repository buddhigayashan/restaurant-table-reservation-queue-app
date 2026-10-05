import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { parseStaff } from '@/services/staff/operations-access';
import { errorMessage } from './helpers';
import type { StaffMember } from '@/types/staff-operations';

export function useStaffAccess(profileOnly = false) {
  const [state, setState] = useState<{ loading: boolean; error: string; profile: StaffMember | null }>({ loading: true, error: '', profile: null });
  useEffect(() => {
    let stopProfile = () => {};
    const stop = onAuthStateChanged(auth, user => {
      stopProfile();
      setState({ loading: !!user, error: user ? '' : 'Please sign in with an active staff account.', profile: null });
      if (!user) return;
      stopProfile = onSnapshot(doc(db, 'staffAccounts', user.uid), snapshot => {
        if (auth.currentUser?.uid !== user.uid) return;
        try {
          if (!snapshot.exists()) throw new Error('No staff profile exists for this account.');
          const profile = parseStaff(user.uid, snapshot.data());
          if (!profile.isActive || profile.email.toLowerCase() !== user.email?.toLowerCase()) throw new Error('An active matching staff profile is required.');
          if (!profileOnly && !['manager', 'staff'].includes(profile.role)) throw new Error('Staff or manager access is required.');
          setState({ loading: false, error: '', profile });
        } catch (error) { setState({ loading: false, error: errorMessage(error), profile: null }); }
      }, error => setState({ loading: false, error: errorMessage(error), profile: null }));
    });
    return () => { stopProfile(); stop(); };
  }, [profileOnly]);
  return { ...state, uid: state.profile?.uid || null };
}
export function useStaffRecords<T>(uid: string | null, listen: (uid: string, next: (rows: T[]) => void, fail: (error: Error) => void) => () => void) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{ uid: string | null; rows: T[]; loading: boolean; error: string }>({ uid: null, rows: [], loading: true, error: '' });
  useEffect(() => {
    if (!uid) return;
    let live = true;
    const stop = listen(uid, rows => { if (live) setState({ uid, rows, loading: false, error: '' }); }, error => { if (live) setState({ uid, rows: [], loading: false, error: errorMessage(error) }); });
    return () => { live = false; stop(); };
  }, [uid, listen, version]);
  return { ...(state.uid === uid && uid ? state : { rows: [] as T[], loading: !!uid, error: '' }), retry: () => { setState({ uid, rows: [], loading: true, error: '' }); setVersion(value => value + 1); } };
}
export function useOperation() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function run(action: () => Promise<string | void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try { setMessage((await action()) || ''); } catch (error) { setError(errorMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  }
  return { busy, error, message, run };
}
export function useStaffClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);
  return now;
}

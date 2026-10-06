import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { estimateWalkInQueue } from '@/features/staff-operations/helpers';

export function useHomeSummary(uid: string | undefined) {
  const [tables, setTables] = useState<number | null>(null);
  const [wait, setWait] = useState<number | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!uid) return;
    const errors = new Map<string, string>();
    const fail = (area: string, message: string) => { errors.set(area, message); setError([...errors.values()].join(' ')); };
    const clear = (area: string) => { errors.delete(area); setError([...errors.values()].join(' ')); };
    const stopTables = onSnapshot(query(collection(db, 'tables'), where('status', '==', 'available')), snapshot => { setTables(snapshot.size); clear('tables'); }, () => { setTables(null); fail('tables', 'Table availability could not be loaded.'); });
    const stopQueue = onSnapshot(query(collection(db, 'queueEntries'), where('status', 'in', ['waiting', 'called'])), snapshot => {
      const rows = snapshot.docs.map(item => ({ status: String(item.data().status), position: Number(item.data().position) || 0 }));
      setWait(estimateWalkInQueue(rows).estimatedWaitMinutes); clear('queue');
    }, () => { setWait(null); fail('queue', 'Waiting estimate could not be loaded.'); });
    return () => { stopTables(); stopQueue(); };
  }, [uid]);
  return { tables, wait, error };
}

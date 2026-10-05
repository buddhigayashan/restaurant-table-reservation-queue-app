import { useRef, useState } from 'react';
import { customerErrorMessage } from '../errors';

export function useSubmit() {
  const inProgress = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function run(action: () => Promise<void>) {
    if (inProgress.current) return;
    inProgress.current = true; setLoading(true); setError('');
    try { await action(); } catch (err) { setError(customerErrorMessage(err)); }
    finally { inProgress.current = false; setLoading(false); }
  }
  return { loading, error, run };
}

import { useEffect, useRef, useState } from 'react';
import { operationError } from '../operations';
export function useLiveRecords<T>(listen: (next: (rows: T[]) => void, fail: (error: Error) => void) => () => void) {
    const [rows, setRows] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [version, setVersion] = useState(0);
    useEffect(() => {
        return listen(records => { setRows(records); setLoading(false); setError(''); }, err => { setRows([]); setLoading(false); setError(operationError(err)); });
    }, [listen, version]);
    function retry() {
        setLoading(true);
        setError('');
        setRows([]);
        setVersion(value => value + 1);
    }
    return { rows, loading, error, retry };
}
export function useOperation() {
    const busy = useRef(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    async function run(action: () => Promise<void>) {
        if (busy.current)
            return;
        busy.current = true;
        setLoading(true);
        setError('');
        try {
            await action();
        }
        catch (err) {
            setError(operationError(err));
        }
        finally {
            busy.current = false;
            setLoading(false);
        }
    }
    return { run, loading, error };
}
export function useClock() {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
    return now;
}

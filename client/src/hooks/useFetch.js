import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/axios';

// In-memory response cache shared across every useFetch call in the app.
// Keeps navigating back to a page instant (stale-while-revalidate) instead
// of re-fetching + re-rendering a loading state every single time.
const cache = new Map();

export function clearCache(prefix) {
  if (!prefix) { cache.clear(); return; }
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}

// Lightweight SWR-style hook: returns cached data instantly if present,
// fires a network request in the background, and re-renders when it lands.
// `deps` controls when the request re-runs (e.g. filters/page changing).
export default function useFetch(url, params, deps = []) {
  const key = `${url}?${JSON.stringify(params || {})}`;
  const [data, setData] = useState(() => cache.get(key));
  const [loading, setLoading] = useState(!cache.has(key));
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const revalidate = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (!cache.has(key)) setLoading(true);
    try {
      const res = await api.get(url, { params, signal: controller.signal });
      cache.set(key, res.data);
      setData(res.data);
      setError(null);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    revalidate();
    return () => controllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...deps]);

  return { data, loading, error, refetch: revalidate };
}

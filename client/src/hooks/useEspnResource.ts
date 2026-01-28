import { useEffect, useMemo, useRef, useState } from "react";

export function useEspnResource<T>(
  key: string,
  url: string | null | undefined,
  options?: {
    intervalMs?: number;
    enabled?: boolean;
  }
) {
  const intervalMs = options?.intervalMs ?? 60_000;
  const enabled = options?.enabled ?? true;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!enabled || !url) return;

    let mounted = true;
    let interval: number | undefined;

    async function load() {
      if (!url) return;
      const current = ++seq.current;
      try {
        setError(null);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
        const json = (await res.json()) as T;
        if (!mounted) return;
        if (current === seq.current) setData(json);
      } catch (e: any) {
        if (!mounted) return;
        if (current === seq.current) setError(e?.message ?? "Failed to load");
      } finally {
        if (!mounted) return;
        if (current === seq.current) setLoading(false);
      }
    }

    setLoading(true);
    load();
    interval = window.setInterval(load, intervalMs);

    return () => {
      mounted = false;
      if (interval) window.clearInterval(interval);
    };
  }, [key, url, intervalMs, enabled]);

  return useMemo(() => ({ data, loading, error }), [data, loading, error]);
}

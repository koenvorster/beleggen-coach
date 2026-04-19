import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "beleggingcoach-watchlist-v1";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setWatchlist(JSON.parse(stored) as string[]);
    } catch {
      // localStorage niet beschikbaar — stille fallback
    }
  }, []);

  const persist = useCallback((next: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore write errors
    }
    setWatchlist(next);
  }, []);

  const add = useCallback(
    (isin: string) => {
      setWatchlist((prev) => {
        if (prev.includes(isin)) return prev;
        const next = [...prev, isin];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const remove = useCallback(
    (isin: string) => {
      setWatchlist((prev) => {
        const next = prev.filter((i) => i !== isin);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const toggle = useCallback(
    (isin: string) => {
      setWatchlist((prev) => {
        const next = prev.includes(isin)
          ? prev.filter((i) => i !== isin)
          : [...prev, isin];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const isInWatchlist = useCallback(
    (isin: string) => watchlist.includes(isin),
    [watchlist],
  );

  return { watchlist, add, remove, toggle, isInWatchlist, mounted };
}

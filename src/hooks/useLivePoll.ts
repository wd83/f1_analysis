"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseLivePollOptions {
  intervalMs: number;
  enabled?: boolean;
  // Pause polling when the browser tab is hidden, to save API quota.
  pauseWhenHidden?: boolean;
}

interface UseLivePollResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean; // true only on the very first fetch
  lastUpdated: number | null; // epoch ms of last successful fetch
  refetch: () => void;
}

// Polls a URL on an interval and exposes the latest payload. Skips overlapping
// requests, pauses on a hidden tab, and refetches immediately when the tab
// becomes visible again so the user isn't staring at stale standings.
export function useLivePoll<T>(
  url: string | null,
  { intervalMs, enabled = true, pauseWhenHidden = true }: UseLivePollOptions
): UseLivePollResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const inFlight = useRef(false);
  const isFirst = useRef(true);

  const fetchOnce = useCallback(async () => {
    if (!url || inFlight.current) return;
    inFlight.current = true;
    if (isFirst.current) setLoading(true);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = (await res.json()) as T;
      setData(json);
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      inFlight.current = false;
      isFirst.current = false;
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!enabled || !url) return;

    // Reset first-fetch flag when the target changes.
    isFirst.current = true;

    const tick = () => {
      if (pauseWhenHidden && document.visibilityState === "hidden") return;
      fetchOnce();
    };

    tick(); // fetch immediately on mount / url change
    const id = setInterval(tick, intervalMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchOnce();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [url, intervalMs, enabled, pauseWhenHidden, fetchOnce]);

  return { data, error, loading, lastUpdated, refetch: fetchOnce };
}

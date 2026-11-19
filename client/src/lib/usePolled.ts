import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./clashApi";

interface Stored<T> {
  key: string;
  data: T;
  updatedAt: Date;
}
interface Failure {
  key: string;
  message: string;
  status: number;
}

export interface Polled<T> {
  data: T | null;
  /** First load (nothing to show yet). */
  loading: boolean;
  /** A refresh is running while older data is still on screen. */
  refreshing: boolean;
  error: { message: string; status: number } | null;
  updatedAt: Date | null;
  refresh: () => void;
}

/**
 * Loads data for `key` (e.g. a clan tag), then keeps it fresh: every `intervalMs` and whenever the tab
 * becomes visible again. `key === null` means "nothing to load". Old data stays on screen if a refresh fails.
 */
export function usePolled<T>(
  key: string | null,
  fetcher: (key: string, signal: AbortSignal) => Promise<T>,
  intervalMs = 60_000
): Polled<T> {
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const [stored, setStored] = useState<Stored<T> | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [pending, setPending] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    setPending(true);
    fetcherRef
      .current(key, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setStored({ key, data, updatedAt: new Date() });
        setFailure(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const known = err instanceof ApiError;
        setFailure({ key, message: known ? err.message : "Something went wrong while loading.", status: known ? err.status : 0 });
      })
      .finally(() => {
        if (!controller.signal.aborted) setPending(false);
      });
    return () => controller.abort();
  }, [key, tick]);

  useEffect(() => {
    if (key === null) return;
    const bump = () => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    };
    const id = window.setInterval(bump, intervalMs);
    document.addEventListener("visibilitychange", bump);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", bump);
    };
  }, [key, intervalMs]);

  // Ignore results/errors that belong to a previous key.
  const current = stored && stored.key === key ? stored : null;
  const failed = failure && failure.key === key ? failure : null;

  return {
    data: current?.data ?? null,
    loading: key !== null && current === null && failed === null,
    refreshing: pending && current !== null,
    error: failed ? { message: failed.message, status: failed.status } : null,
    updatedAt: current?.updatedAt ?? null,
    refresh,
  };
}
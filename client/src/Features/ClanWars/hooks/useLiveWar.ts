import { useCallback, useEffect, useState } from "react";
import { ApiError, clashApi, isActiveWar } from "../../../lib/clashApi";
import { adaptWar } from "../adapter";
import type { War } from "../types";

/** "war" = the regular clan war · "cwl" = your war in the newest Clan War League round. */
export type WarSource = "war" | "cwl";

export interface CwlInfo {
  round: number | null;
  season: string | null;
}

interface Loaded {
  war: War | null;
  cwl: CwlInfo | null;
}
interface Stored extends Loaded {
  key: string;
  updatedAt: Date;
}
interface Failure {
  key: string;
  message: string;
  status: number;
}

/** How often the war is re-fetched while the tab is open (the server also caches for 30s). */
const POLL_MS = 60_000;

async function load(tag: string, source: WarSource, signal: AbortSignal): Promise<Loaded> {
  if (source === "war") {
    const res = await clashApi.getCurrentWar(tag, signal);
    return { war: isActiveWar(res) ? adaptWar(res, 2) : null, cwl: null };
  }
  try {
    const res = await clashApi.getCwlCurrent(tag, signal);
    const war = res.war && isActiveWar(res.war) ? adaptWar(res.war, 1) : null;
    return { war, cwl: { round: res.round, season: res.season } };
  } catch (err) {
    // 404 here just means "this clan is not in a Clan War League right now"
    if (err instanceof ApiError && err.status === 404) return { war: null, cwl: { round: null, season: null } };
    throw err;
  }
}

export interface LiveWar {
  war: War | null;
  /** CWL only: round + season of the war that is shown. */
  cwl: CwlInfo | null;
  /** First load (nothing to show yet). */
  loading: boolean;
  /** A refresh is running while older data is still on screen. */
  refreshing: boolean;
  error: { message: string; status: number } | null;
  updatedAt: Date | null;
  refresh: () => void;
}

/** Real war data for the Clan War page: loads on mount, refreshes every minute, and on demand. */
export function useLiveWar({ clanTag, source }: { clanTag: string | null; source: WarSource }): LiveWar {
  const key = `${source}:${clanTag ?? ""}`;
  const [stored, setStored] = useState<Stored | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [pending, setPending] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!clanTag) return;
    const controller = new AbortController();
    setPending(true);
    load(clanTag, source, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setStored({ ...result, key, updatedAt: new Date() });
        setFailure(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const known = err instanceof ApiError;
        setFailure({
          key,
          message: known ? err.message : "Something went wrong while loading the war.",
          status: known ? err.status : 0,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setPending(false);
      });
    return () => controller.abort();
  }, [clanTag, source, key, tick]);

  // Keep it live: re-fetch every minute, and right away when the tab becomes visible again.
  useEffect(() => {
    if (!clanTag) return;
    const bump = () => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    };
    const id = window.setInterval(bump, POLL_MS);
    document.addEventListener("visibilitychange", bump);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", bump);
    };
  }, [clanTag]);

  // Ignore results/errors that belong to a previous clan or source.
  const current = stored && stored.key === key ? stored : null;
  const failed = failure && failure.key === key ? failure : null;

  return {
    war: current?.war ?? null,
    cwl: current?.cwl ?? null,
    loading: clanTag !== null && current === null && failed === null,
    refreshing: pending && current !== null,
    error: failed ? { message: failed.message, status: failed.status } : null,
    updatedAt: current?.updatedAt ?? null,
    refresh,
  };
}
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { clashApi, type ApiOverview } from "./clashApi";
import { useClanTag } from "./useClanTag";
import { usePolled } from "./usePolled";

export interface ClanData {
  /** The connected clan ("#TAG") or null if none is connected yet. */
  clanTag: string | null;
  setClanTag: (tag: string | null) => void;
  overview: ApiOverview | null;
  loading: boolean;
  refreshing: boolean;
  error: { message: string; status: number } | null;
  updatedAt: Date | null;
  refresh: () => void;
}

const ClanDataContext = createContext<ClanData | null>(null);

/**
 * Loads the connected clan's overview ONCE and shares it with the sidebar and every page
 * (put it around the whole layout). Pages that need more detail (members, roles, ...) fetch their own data.
 */
export function ClanDataProvider({ children }: { children: ReactNode }) {
  const { clanTag, setClanTag } = useClanTag();
  const polled = usePolled(clanTag, (tag, signal) => clashApi.getOverview(tag, signal));

  const value = useMemo<ClanData>(
    () => ({
      clanTag,
      setClanTag,
      overview: polled.data,
      loading: polled.loading,
      refreshing: polled.refreshing,
      error: polled.error,
      updatedAt: polled.updatedAt,
      refresh: polled.refresh,
    }),
    [clanTag, setClanTag, polled.data, polled.loading, polled.refreshing, polled.error, polled.updatedAt, polled.refresh]
  );

  return <ClanDataContext.Provider value={value}>{children}</ClanDataContext.Provider>;
}

/** Live clan data for the sidebar and pages. Must be used inside <ClanDataProvider />. */
export function useClanData(): ClanData {
  const ctx = useContext(ClanDataContext);
  if (!ctx) throw new Error("useClanData must be used inside <ClanDataProvider />");
  return ctx;
}
import { useMemo } from "react";
import { useClanData } from "../../../lib/ClanDataProvider";
import { useClanCapital } from "../../../lib/useClanCapital";
import { adaptCapital } from "../adapter";

/** Live capital data for the Capital Hall page (districts, league, raid weekends, raiders). */
export function useCapitalData() {
  const { clanTag } = useClanData();
  const polled = useClanCapital(clanTag);
  const data = useMemo(() => (polled.data ? adaptCapital(polled.data) : null), [polled.data]);

  return {
    clanTag,
    data,
    loading: polled.loading,
    refreshing: polled.refreshing,
    error: polled.error,
    updatedAt: polled.updatedAt,
    refresh: polled.refresh,
  };
}
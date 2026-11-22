import { useMemo } from "react";
import { useClanData } from "../../../lib/ClanDataProvider";
import { useMembersReport } from "../../../lib/useMembersReport";
import { adaptMembers } from "../adapter";

/** Live members for the Members page: roster, current war, CWL rounds and raid weekends (refreshed every 2 minutes). */
export function useMembers() {
  const { clanTag } = useClanData();
  const polled = useMembersReport(clanTag);
  const data = useMemo(() => (polled.data ? adaptMembers(polled.data) : null), [polled.data]);

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
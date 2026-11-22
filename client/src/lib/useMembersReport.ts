import { clashApi, type ApiMembersReport } from "./clashApi";
import { usePolled, type Polled } from "./usePolled";

/** The connected clan's members with war / CWL / raid details (refreshed every 2 minutes). Pass null to load nothing. */
export function useMembersReport(clanTag: string | null): Polled<ApiMembersReport> {
  return usePolled(clanTag, (tag, signal) => clashApi.getMembersReport(tag, signal), 120_000);
}
import { clashApi, type ApiCapital } from "./clashApi";
import { usePolled, type Polled } from "./usePolled";

/** The connected clan's capital + latest raid weekends (refreshed every 2 minutes). Pass null to load nothing. */
export function useClanCapital(clanTag: string | null): Polled<ApiCapital> {
  return usePolled(clanTag, (tag, signal) => clashApi.getCapital(tag, 6, signal), 120_000);
}
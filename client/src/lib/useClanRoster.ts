import { clashApi, type ApiRoster } from "./clashApi";
import { usePolled, type Polled } from "./usePolled";

/** The connected clan's members (refreshed every 2 minutes). Pass null to load nothing. */
export function useClanRoster(clanTag: string | null): Polled<ApiRoster> {
  return usePolled(clanTag, (tag, signal) => clashApi.getRoster(tag, signal), 120_000);
}
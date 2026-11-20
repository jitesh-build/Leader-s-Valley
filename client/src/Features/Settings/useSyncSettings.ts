import { useEffect } from "react";
import { useClanData } from "../../lib/ClanDataProvider";
import { useSettings } from "./settingsStore";

/**
 * Copies the live clan's name, tag, level and description into the saved settings, so every page that
 * still reads `useSettings()` (reminder messages, Capital Hall, ...) shows the real clan automatically.
 * Call once, inside the layout (it needs <ClanDataProvider />).
 */
export function useSyncSettingsFromClan(): void {
  const { overview } = useClanData();
  const [settings, update] = useSettings();
  const clan = overview?.clan ?? null;

  useEffect(() => {
    if (!clan) return;
    const next = {
      clanName: clan.name,
      clanTag: clan.tag,
      clanLevel: clan.level ?? settings.clanLevel,
      description: clan.description,
    };
    const changed =
      next.clanName !== settings.clanName ||
      next.clanTag !== settings.clanTag ||
      next.clanLevel !== settings.clanLevel ||
      next.description !== settings.description;
    if (changed) update(next);
  }, [clan, settings.clanName, settings.clanTag, settings.clanLevel, settings.description, update]);
}
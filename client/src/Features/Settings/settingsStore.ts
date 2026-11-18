import { useSyncExternalStore } from "react";
import { initials } from "../ClanWars/format";

export interface ClanSettings {
  clanName: string;
  clanTag: string;
  clanLevel: number;
  /** How the app addresses the signed-in leader ("Welcome back, …"). */
  leaderName: string;
  /** Badge letters. Empty = made from the clan name. */
  badgeInitials: string;
  description: string;
  /** Message copied by "Copy reminder" on the Capital Hall page. Tokens: {players} {clan}. */
  raidReminderTemplate: string;
}

export const SETTINGS_KEY = "clan-settings-v1";

export const DEFAULT_SETTINGS: ClanSettings = {
  clanName: "Dark Exiles",
  clanTag: "#2L8Y9J",
  clanLevel: 18,
  leaderName: "Warchief",
  badgeInitials: "DX",
  description: "",
  raidReminderTemplate: "Raid weekend reminder — still have attacks left: {players}. Please use them before it ends!",
};

function load(): ClanSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_SETTINGS, ...(parsed && typeof parsed === "object" ? (parsed as Partial<ClanSettings>) : {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * One shared store (not per-component state) so that saving on the Settings
 * page updates the sidebar, home page, etc. instantly — and across browser tabs.
 */
let current: ClanSettings = load();
const listeners = new Set<() => void>();
const emit = (): void => listeners.forEach((l) => l());

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === SETTINGS_KEY || e.key === null) {
      current = load();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function updateSettings(patch: Partial<ClanSettings>): void {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  } catch {
    /* storage unavailable — change still applies for this session */
  }
  emit();
}

export function useSettings(): [ClanSettings, typeof updateSettings] {
  const settings = useSyncExternalStore(subscribe, () => current, () => DEFAULT_SETTINGS);
  return [settings, updateSettings];
}

/** Letters shown on the clan badge. */
export function badgeInitials(s: Pick<ClanSettings, "badgeInitials" | "clanName">): string {
  const custom = s.badgeInitials.trim().toUpperCase().slice(0, 3);
  return custom || initials(s.clanName);
}

/** Replaces {tokens} in a template; unknown tokens are left as they are. */
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}
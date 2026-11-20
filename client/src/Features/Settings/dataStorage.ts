import { parseClanTag } from "../../lib/clashApi";

export interface DataItem {
  key: string;
  label: string;
  description: string;
  /** Checks a value from a backup file before it is restored. Default: it must be valid JSON. */
  check?: (raw: string) => boolean;
}

const isJson = (raw: string): boolean => {
  try {
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
};

/** Everything the app keeps in this browser until you have accounts. */
export const DATA_ITEMS: DataItem[] = [
  { key: "clan-settings-v1", label: "Clan settings", description: "Display name, badge letters and reminder message" },
  {
    key: "clash-clan-tag-v1",
    label: "Connected clan",
    description: "The clan tag this browser loads live data for",
    check: (raw) => parseClanTag(raw) !== null,
  },
  {
    key: "clanwar-source-v1",
    label: "War view",
    description: "Whether the Clan War page shows the regular war or the CWL round",
    check: (raw) => raw === "war" || raw === "cwl",
  },
  { key: "clanwar-rules-v1", label: "War rules", description: "Rules and custom rules from the Clan War page" },
  { key: "members-notes-v1", label: "Member notes", description: "Leader notes and the watch list" },
  { key: "role-criteria-v1", label: "Role criteria", description: "Promotion and review thresholds" },
  { key: "role-plan-v1", label: "Role to-do list", description: "Planned promotions and demotions" },
  { key: "capital-focus-v1", label: "Capital upgrade focus", description: "District you're saving for and treasury gold" },
  { key: "sidebar-collapsed", label: "Sidebar state", description: "Whether the sidebar is collapsed" },
];

export function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function removeKeys(keys: string[]): void {
  try {
    for (const k of keys) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

export function buildBackup(): string {
  const data: Record<string, string> = {};
  for (const item of DATA_ITEMS) {
    const raw = readRaw(item.key);
    if (raw !== null) data[item.key] = raw;
  }
  return JSON.stringify({ app: "clanforge", version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

export function downloadBackup(): void {
  const blob = new Blob([buildBackup()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clanforge-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type RestoreResult = { ok: true; restored: number } | { ok: false; error: string };

/** Validates a backup file and writes it back. Unknown keys are ignored, never written. */
export function restoreBackup(text: string): RestoreResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  const file = parsed as { app?: unknown; data?: unknown };
  if (!file || file.app !== "clanforge" || !file.data || typeof file.data !== "object") {
    return { ok: false, error: "That doesn't look like a ClanForge backup." };
  }
  const items = new Map(DATA_ITEMS.map((i) => [i.key, i]));
  const entries = Object.entries(file.data as Record<string, unknown>).filter(([k]) => items.has(k));
  for (const [k, v] of entries) {
    if (typeof v !== "string") return { ok: false, error: "The backup contains data in an unexpected format." };
    const check = items.get(k)?.check ?? isJson;
    if (!check(v)) return { ok: false, error: "The backup contains corrupted data." };
  }
  try {
    for (const [k, v] of entries) localStorage.setItem(k, v as string);
  } catch {
    return { ok: false, error: "Couldn't write to browser storage." };
  }
  return { ok: true, restored: entries.length };
}
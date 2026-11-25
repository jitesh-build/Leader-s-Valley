/**
 * Every key this app used to keep in the browser's localStorage, now mirrored per account in the
 * database (see models/UserData.ts). Keep this list in sync with the frontend's
 * lib/persist.ts (SYNCED_KEYS) and Features/Settings/dataStorage.ts (DATA_ITEMS) — all three
 * must list the same keys, or an account's data will only partially sync.
 */
export const ACCOUNT_DATA_KEYS = [
  "clan-settings-v1",
  "clash-clan-tag-v1",
  "clanwar-source-v1",
  "clanwar-rules-v1",
  "members-notes-v1",
  "role-criteria-v1",
  "role-plan-v1",
  "capital-focus-v1",
  "sidebar-collapsed",
] as const;

export type AccountDataKey = (typeof ACCOUNT_DATA_KEYS)[number];

export function isAccountDataKey(key: string): key is AccountDataKey {
  return (ACCOUNT_DATA_KEYS as readonly string[]).includes(key);
}

/** A single key's value is a small JSON blob — this is generous but not unlimited. */
export const MAX_VALUE_BYTES = 200_000;
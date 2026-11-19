import { useCallback, useSyncExternalStore } from "react";

/**
 * The clan this browser is looking at. Stored in localStorage for now (like the clan rules);
 * when accounts exist, load/save it from the user's profile here and nothing else has to change.
 * Every component that calls this hook updates together (and across browser tabs).
 */
const KEY = "clash-clan-tag-v1";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useClanTag(): { clanTag: string | null; setClanTag: (tag: string | null) => void } {
  const clanTag = useSyncExternalStore(subscribe, read, () => null);

  const setClanTag = useCallback((tag: string | null) => {
    try {
      if (tag) localStorage.setItem(KEY, tag);
      else localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable — the tag just won't be remembered */
    }
    listeners.forEach((l) => l());
  }, []);

  return { clanTag, setClanTag };
}
import { useCallback, useEffect, useState } from "react";

export interface MemberNote {
  note: string;
  watch: boolean;
  /** Leader marked this player as a CWL bonus holder (the game doesn't say who gets the bonus medals). */
  bonus?: boolean;
}

const KEY = "members-notes-v1";

function load(): Record<string, MemberNote> {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, MemberNote>) : {};
  } catch {
    return {};
  }
}

/** Merges a change into a note without losing the other fields. */
function merge(prev: MemberNote | undefined, patch: { note?: string; watch?: boolean; bonus?: boolean }): MemberNote {
  const bonus = patch.bonus ?? prev?.bonus ?? false;
  return { note: patch.note ?? prev?.note ?? "", watch: patch.watch ?? prev?.watch ?? false, ...(bonus ? { bonus } : {}) };
}

/** Leader-only notes, watch-list flags and CWL bonus marks, kept in localStorage until there are accounts. */
export function useMemberNotes() {
  const [notes, setNotes] = useState<Record<string, MemberNote>>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(notes));
    } catch {
      /* storage unavailable */
    }
  }, [notes]);

  const setNote = useCallback((tag: string, note: string) => setNotes((prev) => ({ ...prev, [tag]: merge(prev[tag], { note }) })), []);
  const toggleWatch = useCallback((tag: string) => setNotes((prev) => ({ ...prev, [tag]: merge(prev[tag], { watch: !(prev[tag]?.watch ?? false) }) })), []);
  const toggleBonus = useCallback((tag: string) => setNotes((prev) => ({ ...prev, [tag]: merge(prev[tag], { bonus: !(prev[tag]?.bonus ?? false) }) })), []);

  return { notes, setNote, toggleWatch, toggleBonus };
}
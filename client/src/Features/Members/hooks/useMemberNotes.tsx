import { useCallback, useEffect, useState } from "react";

export interface MemberNote {
  note: string;
  watch: boolean;
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

/** Leader-only notes + watch-list flags, kept in localStorage until you have a backend. */
export function useMemberNotes() {
  const [notes, setNotes] = useState<Record<string, MemberNote>>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(notes));
    } catch {
      /* storage unavailable */
    }
  }, [notes]);

  const setNote = useCallback((tag: string, note: string) => {
    setNotes((prev) => ({ ...prev, [tag]: { note, watch: prev[tag]?.watch ?? false } }));
  }, []);

  const toggleWatch = useCallback((tag: string) => {
    setNotes((prev) => ({ ...prev, [tag]: { note: prev[tag]?.note ?? "", watch: !(prev[tag]?.watch ?? false) } }));
  }, []);

  return { notes, setNote, toggleWatch };
}
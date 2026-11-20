import { useCallback, useEffect, useState } from "react";
import type { PlannedChange, Role } from "../types";

const KEY = "role-plan-v1";

function load(): PlannedChange[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PlannedChange[]) : [];
  } catch {
    return [];
  }
}

const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `chg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * The official Clash of Clans API is read-only, so promotions and demotions
 * can't be done from here. This is the leader's to-do list: plan a change,
 * make it in-game, then tick it off.
 */
export function useRoleChanges() {
  const [changes, setChanges] = useState<PlannedChange[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(changes));
    } catch {
      /* storage unavailable */
    }
  }, [changes]);

  const addChange = useCallback((input: { tag: string; name: string; from: Role; to: Role; reason: string }) => {
    setChanges((prev) =>
      prev.some((c) => c.tag === input.tag && !c.done) ? prev : [...prev, { ...input, id: uid(), createdAt: new Date().toISOString(), done: false }]
    );
  }, []);

  const toggleDone = useCallback((id: string) => setChanges((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))), []);
  const removeChange = useCallback((id: string) => setChanges((prev) => prev.filter((c) => c.id !== id)), []);
  const clearDone = useCallback(() => setChanges((prev) => prev.filter((c) => !c.done)), []);

  return { changes, addChange, toggleDone, removeChange, clearDone };
}
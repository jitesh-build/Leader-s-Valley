import { useCallback, useEffect, useState } from "react";
import { DEFAULT_RULES } from "../rules/defaultRules";
import type { Rule } from "../rules/types";

const STORAGE_KEY = "clanwar-rules-v1";

function load(): Rule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RULES;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Rule[]) : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}

/**
 * Rules live in localStorage for now. When you add a backend, replace the
 * load/save here with API calls — nothing else needs to change.
 */
export function useRules() {
  const [rules, setRules] = useState<Rule[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    } catch {
      /* storage unavailable — rules just won't persist */
    }
  }, [rules]);

  /** Adds the rule, or replaces it if one with the same id exists. */
  const saveRule = useCallback((rule: Rule) => {
    setRules((prev) => (prev.some((r) => r.id === rule.id) ? prev.map((r) => (r.id === rule.id ? rule : r)) : [...prev, rule]));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }, []);

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { rules, saveRule, toggleRule, deleteRule };
}
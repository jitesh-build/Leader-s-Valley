import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CRITERIA } from "../criteria";
import type { RoleCriteria } from "../types";

const KEY = "role-criteria-v1";

function load(): RoleCriteria {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_CRITERIA, ...(parsed && typeof parsed === "object" ? (parsed as Partial<RoleCriteria>) : {}) };
  } catch {
    return DEFAULT_CRITERIA;
  }
}

export function useRoleCriteria() {
  const [criteria, setCriteria] = useState<RoleCriteria>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(criteria));
    } catch {
      /* storage unavailable */
    }
  }, [criteria]);

  const setCriterion = useCallback((key: keyof RoleCriteria, value: number) => {
    setCriteria((prev) => ({ ...prev, [key]: Number.isFinite(value) ? value : 0 }));
  }, []);

  const reset = useCallback(() => setCriteria(DEFAULT_CRITERIA), []);

  return { criteria, setCriterion, reset };
}
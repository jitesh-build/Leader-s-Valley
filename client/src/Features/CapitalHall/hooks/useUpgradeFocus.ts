import { useCallback, useEffect, useState } from "react";
import type { UpgradeFocus } from "../types";

const KEY = "capital-focus-v1";
const DEFAULT: UpgradeFocus = { districtId: null, treasury: 0, costs: {} };

/** Key under which the cost of a district's NEXT upgrade is saved. It changes when the district levels up. */
export const costKey = (districtId: number, level: number): string => `${districtId}:${level}`;

function load(): UpgradeFocus {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return DEFAULT;
    const p = parsed as Partial<UpgradeFocus>;
    const costs = p.costs && typeof p.costs === "object" ? p.costs : {};
    // Older versions pre-filled the treasury with a sample number (95,000) — don't keep showing it as if it were real.
    const treasury = typeof p.treasury === "number" && !(p.costs === undefined && p.treasury === 95_000) ? p.treasury : 0;
    return { districtId: typeof p.districtId === "number" ? p.districtId : null, treasury, costs };
  } catch {
    return DEFAULT;
  }
}

/** Which district the clan is saving for, the capital gold in the treasury, and the next-upgrade costs (read off the in-game screen). */
export function useUpgradeFocus() {
  const [focus, setFocus] = useState<UpgradeFocus>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(focus));
    } catch {
      /* storage unavailable */
    }
  }, [focus]);

  const update = useCallback((patch: Partial<Omit<UpgradeFocus, "costs">>) => setFocus((prev) => ({ ...prev, ...patch })), []);

  const setCost = useCallback((districtId: number, level: number, cost: number) => {
    setFocus((prev) => {
      const costs = { ...prev.costs };
      if (cost > 0) costs[costKey(districtId, level)] = cost;
      else delete costs[costKey(districtId, level)];
      return { ...prev, costs };
    });
  }, []);

  return { focus, update, setCost };
}
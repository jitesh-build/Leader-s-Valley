import { useCallback, useEffect, useState } from "react";
import type { UpgradeFocus } from "../types";

const KEY = "capital-focus-v1";
const DEFAULT: UpgradeFocus = { districtId: null, treasury: 95_000 };

function load(): UpgradeFocus {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT, ...(parsed && typeof parsed === "object" ? (parsed as Partial<UpgradeFocus>) : {}) };
  } catch {
    return DEFAULT;
  }
}

/** Which district the clan is saving for, and how much capital gold is in the treasury (read it off the in-game screen). */
export function useUpgradeFocus() {
  const [focus, setFocus] = useState<UpgradeFocus>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(focus));
    } catch {
      /* storage unavailable */
    }
  }, [focus]);

  const update = useCallback((patch: Partial<UpgradeFocus>) => setFocus((prev) => ({ ...prev, ...patch })), []);

  return { focus, update };
}
import type { StarCount } from "../types";

export const STAR_TIER_CLASSES: Record<StarCount, { text: string; bg: string; border: string; label: string }> = {
  3: { text: "text-ok", bg: "bg-ok/15", border: "border-ok", label: "3-star" },
  2: { text: "text-team-bright", bg: "bg-team/15", border: "border-team", label: "2-star" },
  1: { text: "text-enemy-bright", bg: "bg-enemy/15", border: "border-enemy", label: "1-star" },
};

export const STAR_COUNTS: StarCount[] = [3, 2, 1];

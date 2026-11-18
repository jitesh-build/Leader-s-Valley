// import type { StarCount } from "../types";

// export const STAR_TIER_CLASSES: Record<StarCount, { text: string; bg: string; border: string; label: string }> = {
//   3: { text: "text-ok", bg: "bg-ok/15", border: "border-ok", label: "3-star" },
//   2: { text: "text-team-bright", bg: "bg-team/15", border: "border-team", label: "2-star" },
//   1: { text: "text-enemy-bright", bg: "bg-enemy/15", border: "border-enemy", label: "1-star" },
// };

// export const STAR_COUNTS: StarCount[] = [3, 2, 1];

import type { StarCount } from "../types";

/**
 * Colours for the 1 / 2 / 3 star tiers. Uses plain Tailwind colours (readable on the
 * dark game panels). `dot` is a solid colour for tiny indicators.
 */
export const STAR_TIER_CLASSES: Record<StarCount, { text: string; bg: string; border: string; label: string; dot: string }> = {
  3: { text: "text-green-300", bg: "bg-green-500/25", border: "border-green-400/70", label: "3-star", dot: "bg-green-400" },
  2: { text: "text-amber-300", bg: "bg-amber-500/25", border: "border-amber-400/70", label: "2-star", dot: "bg-amber-400" },
  1: { text: "text-red-300", bg: "bg-red-500/25", border: "border-red-400/70", label: "1-star", dot: "bg-red-400" },
};

export const STAR_COUNTS: StarCount[] = [3, 2, 1];
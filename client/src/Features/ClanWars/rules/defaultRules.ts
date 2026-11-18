import type { Rule } from "./types";

/** Starter rules a clan gets the first time they open the page. */
export const DEFAULT_RULES: Rule[] = [
  {
    id: "default-missed",
    type: "missedAttacks",
    title: "Use all of your attacks before the war ends",
    params: { warnHoursLeft: 12 },
    severity: "major",
    enabled: true,
  },
  {
    id: "default-mirror",
    type: "mirror",
    title: "Your first attack must hit within 2 ranks of your own",
    params: { maxRankGap: 2, appliesTo: "first", windowHours: 0 },
    severity: "minor",
    enabled: true,
  },
  {
    id: "default-minstars",
    type: "minStars",
    title: "Your first attack must earn at least 2★",
    params: { minStars: 2, appliesTo: "first" },
    severity: "minor",
    enabled: true,
  },
  {
    id: "default-assigned",
    type: "assignedBase",
    title: "Only attack your assigned base(s)",
    params: {},
    severity: "minor",
    enabled: true,
  },
  {
    id: "default-nopunchup",
    type: "noPunchUp",
    title: "Don't attack above your own rank in the first 12h",
    params: { maxRanksAbove: 0, untilHour: 12 },
    severity: "minor",
    enabled: false,
  },
  {
    id: "default-manual-donate",
    type: "manual",
    title: "Request and donate war troops before preparation ends",
    params: {},
    severity: "minor",
    enabled: true,
    note: "Not auto-checked — leaders verify this by hand.",
  },
];
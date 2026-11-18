/**
 * Valid CWL league tiers. Keep in sync with the client's lib/leagues.ts
 * (same league names, same divisions).
 */
export const LEAGUE_NAMES = ["Bronze", "Silver", "Gold", "Crystal", "Master", "Champion", "Titan", "Legend"] as const;
export const LEAGUE_DIVISIONS = ["I", "II", "III"] as const;

export type LeagueName = (typeof LEAGUE_NAMES)[number];
export type LeagueDivision = (typeof LEAGUE_DIVISIONS)[number];

const NAME_LOOKUP = new Map<string, LeagueName>(LEAGUE_NAMES.map((n) => [n.toLowerCase(), n]));
const DIVISION_LOOKUP = new Map<string, LeagueDivision>([
  ["i", "I"],
  ["ii", "II"],
  ["iii", "III"],
  ["1", "I"],
  ["2", "II"],
  ["3", "III"],
]);

/**
 * Accepts "Crystal II", "crystal ii", "Crystal 2" ... and returns the canonical
 * form ("Crystal II"). Returns null for anything that is not a real league + division.
 */
export function normalizeLeagueTier(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.trim().toLowerCase().match(/^([a-z]+)\s+(iii|ii|i|[123])$/);
  if (!match) return null;
  const [, rawName, rawDivision] = match;
  if (rawName === undefined || rawDivision === undefined) return null;
  const name = NAME_LOOKUP.get(rawName);
  const division = DIVISION_LOOKUP.get(rawDivision);
  return name && division ? `${name} ${division}` : null;
}
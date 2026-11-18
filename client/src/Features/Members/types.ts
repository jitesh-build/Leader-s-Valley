/**
 * Where each piece of member data comes from (matters when you connect real data):
 *  [API]     official Clash of Clans API — /clans/{tag}/members and /players/{tag}
 *  [TRACKED] not available per-member from the API; your backend must record it by
 *            snapshotting wars / CWL rounds / raid weekends / clan games as they happen
 *  [LEADER]  entered by a leader inside this app
 * The mock data in data/mockMembers.ts follows these shapes exactly.
 */

export type Role = "leader" | "coLeader" | "admin" | "member"; // [API] "admin" = Elder
export type TabId = "war" | "cwl" | "capital" | "other";

export interface RuleBreak {
  id: string;
  rule: string;
  detail: string;
  date: string;
  severity: "minor" | "major";
}

/** Clan war record across the wars your backend has tracked. [TRACKED] */
export interface WarStats {
  warsParticipated: number;
  warsEligible: number;
  attacksUsed: number;
  attacksAvailable: number;
  stars: number;
  threeStars: number;
  avgDestruction: number;
  /** Stars earned in each of the last 6 wars (oldest first), null = didn't play. */
  recentStars: (number | null)[];
  ruleBreaks: RuleBreak[];
}

/** Latest CWL season. [TRACKED] — per-round stars come from the league war endpoints. */
export interface CwlStats {
  inLineup: boolean;
  seasonsPlayed: number;
  roundsPlayed: number;
  attacksUsed: number;
  starsThisSeason: number;
  starsAllTime: number;
  /** Who gets bonus medals is a leader decision, not in the API. [LEADER] */
  bonusHolder: boolean;
  bonusesReceived: number;
  ruleBreaks: RuleBreak[];
}

/** Capital raids. attacks/looted come from /capitalraidseasons [API]; the per-district split of
 *  contributions is only visible in-game, so it's [LEADER]/[TRACKED]. */
export interface CapitalStats {
  raidsParticipated: number;
  raidsEligible: number;
  attacksUsed: number;
  attackLimit: number;
  goldLooted: number;
  goldContributedTotal: number;
  contributions: { district: string; amount: number }[];
  ruleBreaks: RuleBreak[];
}

/** Clan games etc. */
export interface GamesStats {
  /** Points in the most recent clan games (max 4000 per player). [TRACKED] */
  clanGamesPoints: number;
  /** Points in the 4 events before that, oldest first. [TRACKED] */
  clanGamesHistory: number[];
}

export interface Member {
  tag: string; // [API]
  name: string; // [API]
  role: Role; // [API]
  townHallLevel: number; // [API]
  trophies: number; // [API]
  donations: number; // [API] given this season
  donationsReceived: number; // [API]
  joinedAt: string; // [TRACKED] first time your backend saw them in the clan
  war: WarStats;
  cwl: CwlStats;
  capital: CapitalStats;
  games: GamesStats;
}
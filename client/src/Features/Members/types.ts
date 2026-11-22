/**
 * Where each piece of member data comes from:
 *  [API]    the official Clash of Clans API, read live (see server /api/clash/clans/:tag/members-report)
 *  [LEADER] entered by a leader inside this app (notes, watch list, CWL bonus)
 * NOT available from the game, so not shown: join date, war history across past wars,
 * clan games points, lifetime capital gold. (They'd need the server to record data over time.)
 */

export type Role = "leader" | "coLeader" | "admin" | "member"; // "admin" = Elder
export type TabId = "war" | "cwl" | "capital" | "other";

export interface WarAttack {
  stars: number;
  destruction: number;
  /** The enemy base number that was hit. */
  defenderPosition: number | null;
}

/** The current / just-ended clan war. [API] */
export interface WarStats {
  position: number;
  attacksUsed: number;
  attacksAvailable: number;
  stars: number;
  threeStars: number;
  avgDestruction: number | null;
  attacks: WarAttack[];
  /** How many times the enemy attacked this player's base. */
  timesAttacked: number;
  /** The best result the enemy got against this player. */
  bestAgainst: { stars: number; destruction: number } | null;
}

export interface CwlRound {
  round: number;
  /** Was in our lineup that round. */
  played: boolean;
  attacked: boolean;
  stars: number | null;
  destruction: number | null;
  /** The round's war is over (so a missing attack is really missed). */
  ended: boolean;
}

/** The current CWL season. [API] */
export interface CwlStats {
  /** Registered for this CWL. */
  registered: boolean;
  /** Rounds that have started. */
  rounds: CwlRound[];
  roundsPlayed: number;
  attacksUsed: number;
  /** Rounds in the lineup that ended without an attack. */
  missedAttacks: number;
  starsThisSeason: number;
  avgDestruction: number | null;
}

/** Capital raids over the weekends the server returned. [API] */
export interface CapitalStats {
  /** Latest weekend. null = not listed for it. */
  raid: { attacksUsed: number; attackLimit: number; looted: number } | null;
  weekendsTracked: number;
  weekendsParticipated: number;
  /** Gold looted over all those weekends. */
  lootedTracked: number;
  /** Unused raid attacks in the latest weekend — only once it has ended. */
  missedLastWeekend: number | null;
}

export interface Member {
  tag: string;
  name: string;
  role: Role;
  townHallLevel: number;
  trophies: number;
  clanRank: number | null;
  /** Donated this season. */
  donations: number;
  donationsReceived: number;
  /** null = not in the current war. */
  war: WarStats | null;
  cwl: CwlStats;
  capital: CapitalStats;
}

export interface WarMeta {
  /** "preparation" | "inWar" | "warEnded" */
  state: string;
  opponent: string | null;
  teamSize: number;
  attacksPerMember: number;
  startTime: string | null;
  endTime: string | null;
}

export interface CwlMeta {
  season: string | null;
  state: string | null;
  roundsStarted: number;
  roundsTotal: number;
  /** The newest round that has started. */
  currentRound: { round: number; state: string | null; opponent: string | null } | null;
}

export interface RaidMeta {
  state: string | null;
  endTime: string | null;
  weekendsTracked: number;
}

export interface MembersData {
  members: Member[];
  war: WarMeta | null;
  cwl: CwlMeta | null;
  raid: RaidMeta | null;
  /** Parts the server couldn't load: "war" (private war log), "cwl", "raid". */
  unavailable: string[];
}
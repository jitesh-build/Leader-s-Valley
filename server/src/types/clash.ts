/**
 * The parts of the official Clash of Clans API responses this project reads
 * (every field is optional on purpose: the API leaves fields out when they don't apply).
 */
export interface RawBadge {
  small?: string;
  medium?: string;
  large?: string;
}

export interface RawMember {
  tag: string;
  name: string;
  /** "leader" | "coLeader" | "admin" (= Elder) | "member" */
  role?: string;
  townHallLevel?: number;
  expLevel?: number;
  trophies?: number;
  clanRank?: number;
  donations?: number;
  donationsReceived?: number;
  league?: { name?: string };
}

export interface RawClan {
  tag: string;
  name: string;
  type?: string;
  description?: string;
  clanLevel?: number;
  clanPoints?: number;
  clanCapitalPoints?: number;
  members?: number;
  badgeUrls?: RawBadge;
  warLeague?: { name?: string };
  capitalLeague?: { name?: string };
  isWarLogPublic?: boolean;
  warFrequency?: string;
  warWins?: number;
  warTies?: number;
  warLosses?: number;
  warWinStreak?: number;
  requiredTownhallLevel?: number;
  memberList?: RawMember[];
  clanCapital?: {
    capitalHallLevel?: number;
    districts?: { id: number; name: string; districtHallLevel: number }[];
  };
}

export interface RawAttack {
  attackerTag: string;
  defenderTag: string;
  stars: number;
  destructionPercentage: number;
  order: number;
}

export interface RawWarMember {
  tag: string;
  name: string;
  /** NOTE: lowercase "h" here, unlike RawMember. */
  townhallLevel?: number;
  mapPosition: number;
  attacks?: RawAttack[];
  opponentAttacks?: number;
  bestOpponentAttack?: RawAttack;
}

export interface RawWarClan {
  tag?: string;
  name?: string;
  badgeUrls?: RawBadge;
  clanLevel?: number;
  attacks?: number;
  stars?: number;
  destructionPercentage?: number;
  members?: RawWarMember[];
}

export interface RawWar {
  /** "notInWar" | "preparation" | "inWar" | "warEnded" */
  state?: string;
  teamSize?: number;
  attacksPerMember?: number;
  preparationStartTime?: string;
  startTime?: string;
  endTime?: string;
  clan?: RawWarClan;
  opponent?: RawWarClan;
}

export interface RawLeagueGroup {
  /** "notInWar" | "preparation" | "inWar" | "ended" */
  state?: string;
  /** e.g. "2026-11" */
  season?: string;
  clans?: {
    tag: string;
    name: string;
    clanLevel?: number;
    badgeUrls?: RawBadge;
    members?: { tag: string; name: string; townHallLevel?: number }[];
  }[];
  rounds?: { warTags?: string[] }[];
}

export interface RawRaidSeason {
  /** "ongoing" | "ended" */
  state?: string;
  startTime?: string;
  endTime?: string;
  capitalTotalLoot?: number;
  raidsCompleted?: number;
  totalAttacks?: number;
  enemyDistrictsDestroyed?: number;
  offensiveReward?: number;
  defensiveReward?: number;
  members?: {
    tag: string;
    name: string;
    attacks?: number;
    attackLimit?: number;
    bonusAttackLimit?: number;
    capitalResourcesLooted?: number;
  }[];
}

export interface RawGoldPass {
  startTime?: string;
  endTime?: string;
}
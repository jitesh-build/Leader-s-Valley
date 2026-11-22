/**
 * Where the data comes from:
 *  /clans/{tag}                    -> capital hall level + district levels, capital league + points   [API]
 *  /clans/{tag}/capitalraidseasons -> raid weekends: loot, attacks, enemies, who attacked            [API]
 * The API does NOT give district upgrade costs or the capital gold in your treasury — a leader types
 * those in (they're shown on the in-game upgrade screen).                                            [LEADER]
 */

export interface District {
  id: number;
  name: string;
  level: number;
  /** Highest level (static game data — see gameData.ts). */
  maxLevel: number;
  /** The Capital Peak, i.e. the Capital Hall itself. */
  isHall: boolean;
}

export interface CapitalInfo {
  hallLevel: number;
  hallMaxLevel: number;
  districts: District[];
  league: string | null;
  points: number | null;
}

export interface RaidEnemy {
  name: string;
  level: number | null;
  districtCount: number;
  districtsDestroyed: number;
  attackCount: number;
}

export interface RaidWeekend {
  state: "ongoing" | "ended";
  startTime: string | null;
  endTime: string | null;
  capitalTotalLoot: number;
  totalAttacks: number;
  attackLimit: number;
  enemyDistrictsDestroyed: number;
  offensiveReward: number;
  defensiveReward: number;
  /** Enemy capitals we raided. */
  attackLog: RaidEnemy[];
  /** Clans that raided us. */
  defenseLog: RaidEnemy[];
}

export interface RaidHistoryItem {
  label: string;
  totalLoot: number;
  medals: number;
}

/** One clan member across the raid weekends we have data for. */
export interface Raider {
  tag: string;
  name: string;
  /** Listed in the latest raid weekend. */
  inLatest: boolean;
  /** Latest weekend. */
  attacks: number;
  attackLimit: number;
  looted: number;
  /** Capital gold looted over every weekend we have data for. */
  lootedTotal: number;
  /** In how many of those weekends they attacked. */
  weekends: number;
}

/** Leader-entered. */
export interface UpgradeFocus {
  districtId: number | null;
  /** Capital gold in the treasury. */
  treasury: number;
  /** Cost of the next upgrade, per "districtId:level" — the key changes when the district levels up, so stale costs vanish. */
  costs: Record<string, number>;
}
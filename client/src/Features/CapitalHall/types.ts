/**
 * Shapes follow the official API where it provides data:
 *  /clans/{tag} -> clanCapital { capitalHallLevel, districts[] }        [API]
 *  /clans/{tag}/capitalraidseasons -> raid weekends (loot, attacks...)  [API]
 * What the API does NOT give (district upgrade costs, the capital gold
 * currently in your treasury) is marked [LEADER] and entered in this app.
 */

export interface District {
  id: number;
  name: string;
  level: number; // [API]
  maxLevel: number; // [static game data]
  /** Capital gold needed for the next level. [static game data / sample] */
  nextCost: number | null;
}

export interface CapitalInfo {
  hallLevel: number;
  hallMaxLevel: number;
  districts: District[];
}

export interface RaidEnemy {
  name: string;
  level: number;
  districtCount: number;
  districtsDestroyed: number;
  attackCount: number;
}

export interface RaidWeekend {
  state: "ongoing" | "ended";
  startTime: string;
  endTime: string;
  capitalTotalLoot: number;
  totalAttacks: number;
  attackLimit: number;
  enemyDistrictsDestroyed: number;
  offensiveReward: number;
  defensiveReward: number;
  attackLog: RaidEnemy[];
}

export interface RaidHistoryItem {
  label: string;
  totalLoot: number;
  medals: number;
}

/** Leader-entered. */
export interface UpgradeFocus {
  districtId: number | null;
  treasury: number;
}
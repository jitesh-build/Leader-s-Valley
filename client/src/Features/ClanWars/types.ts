/**
 * War data, shaped like the official Clash of Clans `currentwar` response
 * (https://developer.clashofclans.com). When the real API is connected, write
 * ONE adapter that turns the API response into these types — the page,
 * components and rule engine don't need to change.
 */

export type WarState = "preparation" | "inWar" | "warEnded";
export type StarValue = 0 | 1 | 2 | 3;

export interface WarAttack {
  attackerTag: string;
  defenderTag: string;
  stars: StarValue;
  destructionPercentage: number;
  /** Position of this attack in the whole war (1 = very first attack). */
  order: number;
  /**
   * NOT part of the official API — it doesn't tell you WHEN an attack happened.
   * To enable time-based rules (e.g. "mirror in the first 12h") in production,
   * your backend should poll the war every few minutes and stamp each attack
   * with the time it first appeared. Rules that need a time simply skip
   * attacks without one, so they never accuse anyone on missing data.
   */
  observedAt?: string;
}

export interface WarMember {
  tag: string;
  name: string;
  townhallLevel: number;
  mapPosition: number;
  /** The API omits this until a member attacks — the adapter should default it to []. */
  attacks: WarAttack[];
}

export interface WarSide {
  tag: string;
  name: string;
  clanLevel: number;
  /** Total attacks used by this side. */
  attacks: number;
  stars: number;
  destructionPercentage: number;
  members: WarMember[];
}

export interface War {
  state: WarState;
  teamSize: number;
  /** Not in the API: 2 for regular wars, 1 for CWL. */
  attacksPerMember: number;
  preparationStartTime: string;
  startTime: string;
  endTime: string;
  clan: WarSide;
  opponent: WarSide;
}
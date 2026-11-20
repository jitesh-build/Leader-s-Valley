import type { RawClan, RawRaidSeason, RawWar } from "../types/clash";
import { mapMember, mapWar } from "./clashMappers";

export interface RosterInput {
  clan: RawClan;
  /** The regular clan war (may be { state: "notInWar" }). */
  war: RawWar | null;
  /** Newest capital raid weekend. */
  raid: RawRaidSeason | null;
  unavailable: string[];
}

/**
 * Every clan member with what the game really tells us about them:
 * role, town hall, season donations, attacks in the current war and in the latest capital raid weekend.
 * (Join date, war history and clan games are NOT in the official API, so they are not here.)
 */
export function buildRoster(input: RosterInput) {
  const { clan } = input;

  // attacks in the war (only once battle day has started)
  const mapped = input.war ? mapWar(input.war, clan.tag) : null;
  const war = mapped && "clan" in mapped && (mapped.state === "inWar" || mapped.state === "warEnded") ? mapped : null;
  const attacksPerMember = war ? (war.attacksPerMember ?? 2) : 0;
  const warByTag = new Map(
    (war?.clan.members ?? []).map((m) => [
      m.tag,
      { attacksUsed: m.attacks.length, attacksAvailable: attacksPerMember, stars: m.attacks.reduce((s, a) => s + a.stars, 0) },
    ])
  );

  // attacks in the newest raid weekend
  const raidByTag = new Map(
    (input.raid?.members ?? []).map((m) => [
      m.tag,
      {
        attacksUsed: m.attacks ?? 0,
        attackLimit: (m.attackLimit ?? 0) + (m.bonusAttackLimit ?? 0),
        looted: m.capitalResourcesLooted ?? 0,
      },
    ])
  );

  return {
    clanTag: clan.tag,
    members: (clan.memberList ?? []).map((raw) => {
      const m = mapMember(raw);
      return {
        tag: m.tag,
        name: m.name,
        role: m.role,
        townHallLevel: m.townHallLevel,
        trophies: m.trophies,
        clanRank: m.clanRank,
        donations: m.donations,
        donationsReceived: m.donationsReceived,
        war: warByTag.get(m.tag) ?? null,
        raid: raidByTag.get(m.tag) ?? null,
      };
    }),
    war: war ? { state: war.state, teamSize: war.teamSize ?? 0, attacksPerMember, endTime: war.endTime } : null,
    raid: input.raid ? { state: input.raid.state ?? null } : null,
    unavailable: input.unavailable,
  };
}
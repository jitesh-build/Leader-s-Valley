import type { RawClan, RawLeagueGroup, RawRaidSeason, RawWar } from "../types/clash";
import { mapLeagueGroup, mapMember, mapRaidSeason, mapWar } from "./clashMappers";

export interface MembersReportInput {
  clan: RawClan;
  /** The regular clan war (may be { state: "notInWar" }). */
  war: RawWar | null;
  /** The CWL group plus our war in every round that has started (null war = not found). */
  cwl: { group: RawLeagueGroup; wars: { round: number; war: RawWar | null }[] } | null;
  /** Capital raid weekends, newest first. */
  raids: RawRaidSeason[];
  unavailable: string[];
}

/**
 * Everything the Members page needs in one response: the roster, the current war per member,
 * every CWL round per member, and the recent capital raid weekends per member.
 * Only data the official API really provides — no join dates, war history or clan games.
 */
export function buildMembersReport(input: MembersReportInput) {
  const { clan } = input;

  const members = (clan.memberList ?? []).map((raw) => {
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
    };
  });

  // ---- the regular war
  const mapped = input.war ? mapWar(input.war, clan.tag) : null;
  let war = null;
  if (mapped && "clan" in mapped) {
    const enemyPosition = new Map(mapped.opponent.members.map((m) => [m.tag, m.mapPosition]));
    war = {
      state: mapped.state,
      teamSize: mapped.teamSize ?? Math.max(mapped.clan.members.length, mapped.opponent.members.length),
      attacksPerMember: mapped.attacksPerMember ?? 2,
      startTime: mapped.startTime,
      endTime: mapped.endTime,
      opponent: { name: mapped.opponent.name, tag: mapped.opponent.tag },
      members: mapped.clan.members.map((m) => ({
        tag: m.tag,
        mapPosition: m.mapPosition,
        attacks: m.attacks.map((a) => ({
          stars: a.stars,
          destructionPercentage: a.destructionPercentage,
          order: a.order,
          defenderPosition: enemyPosition.get(a.defenderTag) ?? null,
        })),
        opponentAttacks: m.opponentAttacks,
        bestOpponentAttack: m.bestOpponentAttack,
      })),
    };
  }

  // ---- Clan War League
  let cwl = null;
  if (input.cwl) {
    const group = mapLeagueGroup(input.cwl.group, clan.tag);
    const us = group.clans.find((c) => c.isUs);
    cwl = {
      season: group.season,
      state: group.state,
      /** Everyone registered for this CWL (the lineup pool). */
      registered: (us?.members ?? []).map((m) => m.tag),
      roundsTotal: group.rounds.length || 7,
      rounds: input.cwl.wars.map(({ round, war: raw }) => {
        const w = raw ? mapWar(raw, clan.tag) : null;
        if (!w || !("clan" in w)) return { round, state: null, startTime: null, endTime: null, opponent: null, members: [] };
        return {
          round,
          state: w.state,
          startTime: w.startTime,
          endTime: w.endTime,
          opponent: { name: w.opponent.name, tag: w.opponent.tag },
          members: w.clan.members.map((m) => ({
            tag: m.tag,
            attacks: m.attacks.map((a) => ({ stars: a.stars, destructionPercentage: a.destructionPercentage })),
          })),
        };
      }),
    };
  }

  // ---- capital raid weekends (just what the members table needs)
  const raids = input.raids.map((r) => {
    const s = mapRaidSeason(r);
    return { state: s.state, startTime: s.startTime, endTime: s.endTime, totalLoot: s.totalLoot, members: s.members };
  });

  return { clanTag: clan.tag, fetchedAt: new Date().toISOString(), members, war, cwl, raids, unavailable: input.unavailable };
}
import { normalizeLeagueTier } from "../types/leagues";
import type {
  RawClan,
  RawGoldPass,
  RawLeagueGroup,
  RawMember,
  RawRaidSeason,
  RawWar,
  RawWarClan,
} from "../types/clash";

/** The API writes times as "20261118T080000.000Z" — convert to ISO 8601. */
export function parseCocTime(t?: string | null): string | null {
  if (!t) return null;
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z$/.exec(t);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.${m[7]}Z`;
}

/** "Crystal League II" -> "Crystal II" (the format this site saves as war.leagueTier). null if unranked / unknown. */
export function leagueTierFromName(name?: string): string | null {
  const m = /^([a-z]+)\s+league\s+(iii|ii|i)$/i.exec((name ?? "").trim());
  return m && m[1] && m[2] ? normalizeLeagueTier(`${m[1]} ${m[2]}`) : null;
}

export type Role = "leader" | "coLeader" | "elder" | "member";

const ROLE_MAP: Record<string, Role> = { leader: "leader", coLeader: "coLeader", admin: "elder", member: "member" };
export const ROLE_LABEL: Record<Role, string> = {
  leader: "Leader",
  coLeader: "Co-leader",
  elder: "Elder",
  member: "Member",
};

export function mapMember(m: RawMember) {
  const role: Role = ROLE_MAP[m.role ?? ""] ?? "member";
  return {
    tag: m.tag,
    name: m.name,
    role,
    roleLabel: ROLE_LABEL[role],
    townHallLevel: m.townHallLevel ?? null,
    expLevel: m.expLevel ?? null,
    trophies: m.trophies ?? null,
    clanRank: m.clanRank ?? null,
    donations: m.donations ?? 0,
    donationsReceived: m.donationsReceived ?? 0,
    league: m.league?.name ?? null,
  };
}

export function mapClanSummary(c: RawClan) {
  return {
    tag: c.tag,
    name: c.name,
    description: c.description ?? "",
    type: c.type ?? null,
    badge: c.badgeUrls?.medium ?? null,
    level: c.clanLevel ?? null,
    points: c.clanPoints ?? null,
    memberCount: c.members ?? c.memberList?.length ?? 0,
    requiredTownHall: c.requiredTownhallLevel ?? null,
    isWarLogPublic: c.isWarLogPublic ?? false,
    war: {
      frequency: c.warFrequency ?? null,
      wins: c.warWins ?? 0,
      ties: c.warTies ?? 0,
      losses: c.warLosses ?? 0,
      winStreak: c.warWinStreak ?? 0,
    },
    /** Raw name from the game, e.g. "Crystal League II" (null when unranked). */
    warLeague: c.warLeague?.name ?? null,
    /** Same league in this site's format, e.g. "Crystal II" — can pre-fill the league when creating a war. */
    leagueTier: leagueTierFromName(c.warLeague?.name),
  };
}

export function mapRoles(c: RawClan) {
  const members = (c.memberList ?? []).map(mapMember);
  const pick = (role: Role) =>
    members.filter((m) => m.role === role).map((m) => ({ tag: m.tag, name: m.name, townHallLevel: m.townHallLevel }));
  return {
    clanTag: c.tag,
    counts: {
      leader: members.filter((m) => m.role === "leader").length,
      coLeader: members.filter((m) => m.role === "coLeader").length,
      elder: members.filter((m) => m.role === "elder").length,
      member: members.filter((m) => m.role === "member").length,
      total: members.length,
    },
    leader: pick("leader"),
    coLeaders: pick("coLeader"),
    elders: pick("elder"),
  };
}

export function mapRaidSeason(s: RawRaidSeason) {
  return {
    state: s.state ?? null,
    startTime: parseCocTime(s.startTime),
    endTime: parseCocTime(s.endTime),
    totalLoot: s.capitalTotalLoot ?? 0,
    raidsCompleted: s.raidsCompleted ?? 0,
    totalAttacks: s.totalAttacks ?? 0,
    districtsDestroyed: s.enemyDistrictsDestroyed ?? 0,
    offensiveReward: s.offensiveReward ?? 0,
    defensiveReward: s.defensiveReward ?? 0,
    members: (s.members ?? []).map((m) => ({
      tag: m.tag,
      name: m.name,
      attacks: m.attacks ?? 0,
      attackLimit: (m.attackLimit ?? 0) + (m.bonusAttackLimit ?? 0),
      looted: m.capitalResourcesLooted ?? 0,
    })),
  };
}

export function mapCapital(c: RawClan, seasons: RawRaidSeason[]) {
  const cap = c.clanCapital;
  return {
    clanTag: c.tag,
    capitalHallLevel: cap?.capitalHallLevel ?? null,
    districts: (cap?.districts ?? []).map((d) => ({ id: d.id, name: d.name, level: d.districtHallLevel })),
    capitalLeague: c.capitalLeague?.name ?? null,
    capitalPoints: c.clanCapitalPoints ?? null,
    raidSeasons: seasons.map(mapRaidSeason),
  };
}

function mapWarClan(c: RawWarClan | undefined) {
  return {
    tag: c?.tag ?? null,
    name: c?.name ?? null,
    badge: c?.badgeUrls?.medium ?? null,
    level: c?.clanLevel ?? null,
    attacks: c?.attacks ?? 0,
    stars: c?.stars ?? 0,
    destructionPercentage: c?.destructionPercentage ?? 0,
    members: (c?.members ?? [])
      .map((m) => ({
        tag: m.tag,
        name: m.name,
        townHallLevel: m.townhallLevel ?? null,
        /** Base number in the war (1 = top). Matches the "base #" in this site's slots. */
        mapPosition: m.mapPosition,
        attacks: (m.attacks ?? []).map((a) => ({
          defenderTag: a.defenderTag,
          stars: a.stars,
          destructionPercentage: a.destructionPercentage,
          order: a.order,
        })),
        opponentAttacks: m.opponentAttacks ?? 0,
        bestOpponentAttack: m.bestOpponentAttack
          ? { stars: m.bestOpponentAttack.stars, destructionPercentage: m.bestOpponentAttack.destructionPercentage }
          : null,
      }))
      .sort((a, b) => a.mapPosition - b.mapPosition),
  };
}

export interface MappedWar {
  state: string;
  teamSize: number | null;
  attacksPerMember: number | null;
  preparationStartTime: string | null;
  startTime: string | null;
  endTime: string | null;
  clan: ReturnType<typeof mapWarClan>;
  opponent: ReturnType<typeof mapWarClan>;
}

/** Full war detail. If ourTag is given and we are listed as the opponent, the sides are swapped so `clan` is always us. */
export function mapWar(w: RawWar, ourTag?: string): MappedWar | { state: "notInWar" } {
  if (!w.state || w.state === "notInWar") return { state: "notInWar" };
  const swap = ourTag !== undefined && w.opponent?.tag === ourTag && w.clan?.tag !== ourTag;
  const us = swap ? w.opponent : w.clan;
  const them = swap ? w.clan : w.opponent;
  return {
    state: w.state,
    teamSize: w.teamSize ?? null,
    attacksPerMember: w.attacksPerMember ?? null,
    preparationStartTime: parseCocTime(w.preparationStartTime),
    startTime: parseCocTime(w.startTime),
    endTime: parseCocTime(w.endTime),
    clan: mapWarClan(us),
    opponent: mapWarClan(them),
  };
}

/** Light version used for lists of wars (no members). */
export function mapWarBrief(w: RawWar, ourTag: string) {
  const full = mapWar(w, ourTag);
  if (!("clan" in full)) return full;
  const brief = (c: MappedWar["clan"]) => ({
    tag: c.tag,
    name: c.name,
    stars: c.stars,
    destructionPercentage: c.destructionPercentage,
  });
  return {
    state: full.state,
    teamSize: full.teamSize,
    startTime: full.startTime,
    endTime: full.endTime,
    clan: brief(full.clan),
    opponent: brief(full.opponent),
    isOurWar: full.clan.tag === ourTag,
  };
}

export function mapLeagueGroup(g: RawLeagueGroup, ourTag: string) {
  return {
    state: g.state ?? null,
    season: g.season ?? null,
    clans: (g.clans ?? []).map((c) => ({
      tag: c.tag,
      name: c.name,
      level: c.clanLevel ?? null,
      badge: c.badgeUrls?.medium ?? null,
      isUs: c.tag === ourTag,
      memberCount: c.members?.length ?? 0,
      members: (c.members ?? [])
        .map((m) => ({ tag: m.tag, name: m.name, townHallLevel: m.townHallLevel ?? null }))
        .sort((a, b) => (b.townHallLevel ?? 0) - (a.townHallLevel ?? 0)),
    })),
    rounds: (g.rounds ?? []).map((r, i) => {
      const warTags = (r.warTags ?? []).filter((t) => t !== "#0");
      return { round: i + 1, started: warTags.length > 0, warTags };
    }),
  };
}

export function mapGoldPass(g: RawGoldPass) {
  return { startTime: parseCocTime(g.startTime), endTime: parseCocTime(g.endTime) };
}

export type EventState = "upcoming" | "active" | "ended";

export function stateFromTimes(start: string | null, end: string | null, now = Date.now()): EventState | null {
  const s = start ? Date.parse(start) : NaN;
  const e = end ? Date.parse(end) : NaN;
  if (Number.isNaN(s) || Number.isNaN(e)) return null;
  return now < s ? "upcoming" : now <= e ? "active" : "ended";
}
import type { RawClan, RawGoldPass, RawLeagueGroup, RawRaidSeason, RawWar } from "../types/clash";
import { mapClanSummary, mapGoldPass, mapLeagueGroup, mapMember, mapWar, parseCocTime } from "./clashMappers";
import type { MappedWar } from "./clashMappers";

export interface OverviewInput {
  clan: RawClan;
  /** Newest capital raid weekend, if the clan has one. */
  raid: RawRaidSeason | null;
  /** The regular clan war (may be { state: "notInWar" }). */
  war: RawWar | null;
  /** The CWL group, plus our war in its newest round (null if not found). */
  cwl: { group: RawLeagueGroup; ourWar: RawWar | null } | null;
  goldPass: RawGoldPass | null;
  /** Sections that could not be loaded (shown to the user instead of failing the whole page). */
  unavailable: string[];
}

const pct = (part: number, whole: number): number | null => (whole > 0 ? Math.round((part / whole) * 100) : null);

function side(s: MappedWar["clan"]) {
  return {
    tag: s.tag,
    name: s.name,
    badge: s.badge,
    stars: s.stars,
    attacks: s.attacks,
    destructionPercentage: s.destructionPercentage,
  };
}

function warBlock(raw: RawWar, ourTag: string, kind: "war" | "cwl", round: number | null) {
  const w = mapWar(raw, ourTag);
  if (!("clan" in w)) return null;
  return {
    kind,
    round,
    state: w.state,
    teamSize: w.teamSize ?? Math.max(w.clan.members.length, w.opponent.members.length),
    attacksPerMember: w.attacksPerMember ?? (kind === "cwl" ? 1 : 2),
    preparationStartTime: w.preparationStartTime,
    startTime: w.startTime,
    endTime: w.endTime,
    us: side(w.clan),
    them: side(w.opponent),
  };
}

/** Everything the Home page and the sidebar show, computed once on the server. */
export function buildOverview(input: OverviewInput) {
  const { clan, raid, goldPass } = input;
  const members = (clan.memberList ?? []).map(mapMember);
  const total = members.length;

  const townHalls = members.map((m) => m.townHallLevel).filter((n): n is number => n !== null);
  const averageTownHall = townHalls.length > 0 ? Math.round((townHalls.reduce((a, b) => a + b, 0) / townHalls.length) * 10) / 10 : null;
  const donating = members.filter((m) => m.donations > 0).length;

  // --- war: the regular war if there is one, otherwise our war in the newest CWL round
  const regular = input.war ? warBlock(input.war, clan.tag, "war", null) : null;
  let cwl: { state: string | null; season: string | null; round: number | null; roundsStarted: number } | null = null;
  let war = regular;
  if (input.cwl) {
    const group = mapLeagueGroup(input.cwl.group, clan.tag);
    const started = group.rounds.filter((r) => r.started);
    const latest = started[started.length - 1];
    cwl = { state: group.state, season: group.season, round: latest?.round ?? null, roundsStarted: started.length };
    if (!war && input.cwl.ourWar) war = warBlock(input.cwl.ourWar, clan.tag, "cwl", latest?.round ?? null);
  }

  // --- capital raid weekend
  const raidMembers = raid?.members ?? [];
  const raidUsed = raidMembers.reduce((s, m) => s + (m.attacks ?? 0), 0);
  const raidLimit = raidMembers.reduce((s, m) => s + (m.attackLimit ?? 0) + (m.bonusAttackLimit ?? 0), 0);

  // --- clan health: only metrics the game really gives us
  const warMax = war ? war.teamSize * war.attacksPerMember : 0;
  const warCounts = war !== null && (war.state === "inWar" || war.state === "warEnded");
  const metrics = [
    {
      id: "donations",
      label: "Donations",
      value: pct(donating, total),
      detail: `${donating} of ${total} members have donated this season`,
    },
    {
      id: "raids",
      label: "Capital raids",
      value: pct(raidUsed, raidLimit),
      detail: raid ? `${raidUsed} of ${raidLimit} raid attacks used` : "No raid weekend yet",
    },
    {
      id: "war",
      label: "War attacks",
      value: warCounts && war ? pct(war.us.attacks, warMax) : null,
      detail: warCounts && war ? `${war.us.attacks} of ${warMax} attacks used in the current war` : "No war in battle",
    },
  ];
  const known = metrics.map((m) => m.value).filter((v): v is number => v !== null);
  const score = known.length > 0 ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : null;

  const cap = clan.clanCapital;

  return {
    fetchedAt: new Date().toISOString(),
    clan: mapClanSummary(clan),
    members: {
      total,
      averageTownHall,
      donatingMembers: donating,
      roles: {
        leader: members.filter((m) => m.role === "leader").length,
        coLeader: members.filter((m) => m.role === "coLeader").length,
        elder: members.filter((m) => m.role === "elder").length,
        member: members.filter((m) => m.role === "member").length,
      },
    },
    capital: {
      hallLevel: cap?.capitalHallLevel ?? null,
      districtCount: cap?.districts?.length ?? 0,
      league: clan.capitalLeague?.name ?? null,
      points: clan.clanCapitalPoints ?? null,
    },
    raid: raid
      ? {
          state: raid.state ?? null,
          startTime: parseCocTime(raid.startTime),
          endTime: parseCocTime(raid.endTime),
          attacksUsed: raidUsed,
          attackLimit: raidLimit,
          totalLoot: raid.capitalTotalLoot ?? 0,
        }
      : null,
    war,
    cwl,
    /** The current Gold Pass season (used as "the season" in the sidebar). */
    season: goldPass ? mapGoldPass(goldPass) : null,
    health: { score, metrics },
    unavailable: input.unavailable,
  };
}
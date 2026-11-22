import type { ApiMembersReport } from "../../lib/clashApi";
import type { CapitalStats, CwlRound, CwlStats, Member, MembersData, WarStats } from "./types";

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);
const avg = (xs: number[]): number | null => (xs.length > 0 ? Math.round(sum(xs) / xs.length) : null);

/** Backend response -> the `Member` rows the Members page draws. */
export function adaptMembers(api: ApiMembersReport): MembersData {
  const warByTag = new Map((api.war?.members ?? []).map((m) => [m.tag, m]));
  const registered = new Set(api.cwl?.registered ?? []);
  const latestRaid = api.raids[0] ?? null;

  const members: Member[] = api.members.map((m) => {
    // ---- the current war
    const w = warByTag.get(m.tag);
    const war: WarStats | null =
      api.war && w
        ? {
            position: w.mapPosition,
            attacksUsed: w.attacks.length,
            attacksAvailable: api.war.attacksPerMember,
            stars: sum(w.attacks.map((a) => a.stars)),
            threeStars: w.attacks.filter((a) => a.stars === 3).length,
            avgDestruction: avg(w.attacks.map((a) => a.destructionPercentage)),
            attacks: [...w.attacks]
              .sort((a, b) => a.order - b.order)
              .map((a) => ({ stars: a.stars, destruction: Math.round(a.destructionPercentage), defenderPosition: a.defenderPosition })),
            timesAttacked: w.opponentAttacks,
            bestAgainst: w.bestOpponentAttack ? { stars: w.bestOpponentAttack.stars, destruction: Math.round(w.bestOpponentAttack.destructionPercentage) } : null,
          }
        : null;

    // ---- this CWL season, round by round
    const rounds: CwlRound[] = (api.cwl?.rounds ?? []).map((r) => {
      const entry = r.members.find((x) => x.tag === m.tag);
      const attack = entry?.attacks[0];
      return {
        round: r.round,
        played: entry !== undefined,
        attacked: attack !== undefined,
        stars: attack ? attack.stars : null,
        destruction: attack ? Math.round(attack.destructionPercentage) : null,
        ended: r.state === "warEnded",
      };
    });
    const played = rounds.filter((r) => r.played);
    const attacked = played.filter((r) => r.attacked);
    const cwl: CwlStats = {
      registered: registered.has(m.tag) || played.length > 0,
      rounds,
      roundsPlayed: played.length,
      attacksUsed: attacked.length,
      missedAttacks: played.filter((r) => r.ended && !r.attacked).length,
      starsThisSeason: sum(attacked.map((r) => r.stars ?? 0)),
      avgDestruction: avg(attacked.map((r) => r.destruction ?? 0)),
    };

    // ---- capital raids
    const entries = api.raids.map((r) => r.members.find((x) => x.tag === m.tag));
    const latest = entries[0];
    const capital: CapitalStats = {
      raid: latest ? { attacksUsed: latest.attacks, attackLimit: latest.attackLimit, looted: latest.looted } : null,
      weekendsTracked: api.raids.length,
      weekendsParticipated: entries.filter((e) => e !== undefined && e.attacks > 0).length,
      lootedTracked: sum(entries.map((e) => e?.looted ?? 0)),
      missedLastWeekend: latestRaid?.state === "ended" && latest ? Math.max(0, latest.attackLimit - latest.attacks) : null,
    };

    return {
      tag: m.tag,
      name: m.name,
      role: m.role === "elder" ? "admin" : m.role,
      townHallLevel: m.townHallLevel ?? 1,
      trophies: m.trophies ?? 0,
      clanRank: m.clanRank,
      donations: m.donations,
      donationsReceived: m.donationsReceived,
      war,
      cwl,
      capital,
    };
  });

  const started = api.cwl?.rounds ?? [];
  const current = started[started.length - 1];

  return {
    members,
    war: api.war && {
      state: api.war.state,
      opponent: api.war.opponent.name,
      teamSize: api.war.teamSize,
      attacksPerMember: api.war.attacksPerMember,
      startTime: api.war.startTime,
      endTime: api.war.endTime,
    },
    cwl: api.cwl && {
      season: api.cwl.season,
      state: api.cwl.state,
      roundsStarted: started.length,
      roundsTotal: api.cwl.roundsTotal,
      currentRound: current ? { round: current.round, state: current.state, opponent: current.opponent?.name ?? null } : null,
    },
    raid: latestRaid && { state: latestRaid.state, endTime: latestRaid.endTime, weekendsTracked: api.raids.length },
    unavailable: api.unavailable,
  };
}
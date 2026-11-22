import type { ApiCapital } from "../../lib/clashApi";
import { CAPITAL_HALL_MAX_LEVEL, CAPITAL_PEAK_ID, CAPITAL_PEAK_NAME, DISTRICT_HALL_MAX_LEVEL } from "./gameData";
import type { CapitalInfo, District, RaidHistoryItem, RaidWeekend, Raider } from "./types";

export interface CapitalData {
  /** false = the clan hasn't unlocked the Clan Capital. */
  unlocked: boolean;
  capital: CapitalInfo;
  /** The newest raid weekend (live or just ended). null = the clan has none yet. */
  weekend: RaidWeekend | null;
  /** Earlier weekends, oldest first. */
  history: RaidHistoryItem[];
  raiders: Raider[];
  /** Clan members who aren't listed in the latest weekend at all. */
  noActivity: { tag: string; name: string }[];
  /** How many weekends the leaderboards add up. */
  weekendsTracked: number;
}

const dayLabel = (iso: string | null): string => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "?");

/** Backend response -> what the Capital Hall page draws. */
export function adaptCapital(api: ApiCapital): CapitalData {
  // ---- districts
  let districts: District[] = api.districts.map((d) => {
    const isHall = d.name === CAPITAL_PEAK_NAME;
    const cap = isHall ? CAPITAL_HALL_MAX_LEVEL : DISTRICT_HALL_MAX_LEVEL;
    return { id: d.id, name: d.name, level: d.level, maxLevel: Math.max(cap, d.level), isHall };
  });
  if (api.capitalHallLevel !== null && !districts.some((d) => d.isHall)) {
    districts = [
      { id: CAPITAL_PEAK_ID, name: CAPITAL_PEAK_NAME, level: api.capitalHallLevel, maxLevel: Math.max(CAPITAL_HALL_MAX_LEVEL, api.capitalHallLevel), isHall: true },
      ...districts,
    ];
  }
  districts.sort((a, b) => Number(b.isHall) - Number(a.isHall) || a.id - b.id);

  const hallLevel = api.capitalHallLevel ?? districts.find((d) => d.isHall)?.level ?? 0;
  const capital: CapitalInfo = {
    hallLevel,
    hallMaxLevel: Math.max(CAPITAL_HALL_MAX_LEVEL, hallLevel),
    districts,
    league: api.capitalLeague,
    points: api.capitalPoints,
  };

  // ---- raid weekends (API order: newest first)
  const seasons = api.raidSeasons;
  const latest = seasons[0] ?? null;

  const weekend: RaidWeekend | null = latest && {
    state: latest.state === "ongoing" ? "ongoing" : "ended",
    startTime: latest.startTime,
    endTime: latest.endTime,
    capitalTotalLoot: latest.totalLoot,
    totalAttacks: latest.totalAttacks,
    attackLimit: latest.attackLimit,
    enemyDistrictsDestroyed: latest.districtsDestroyed,
    offensiveReward: latest.offensiveReward,
    defensiveReward: latest.defensiveReward,
    attackLog: latest.attackLog.map((e) => ({ name: e.name, level: e.level, districtCount: e.districtCount, districtsDestroyed: e.districtsDestroyed, attackCount: e.attackCount })),
    defenseLog: latest.defenseLog.map((e) => ({ name: e.name, level: e.level, districtCount: e.districtCount, districtsDestroyed: e.districtsDestroyed, attackCount: e.attackCount })),
  };

  const history: RaidHistoryItem[] = seasons
    .slice(1, 6)
    .map((s) => ({ label: dayLabel(s.endTime), totalLoot: s.totalLoot, medals: s.offensiveReward + s.defensiveReward }))
    .reverse();

  // ---- raiders: current clan members (plus anyone in the latest weekend), over every weekend we have
  const inClan = new Set(api.clanMembers.map((m) => m.tag));
  const latestByTag = new Map((latest?.members ?? []).map((m) => [m.tag, m]));
  const totals = new Map<string, { name: string; lootedTotal: number; weekends: number }>();
  for (const s of seasons) {
    for (const m of s.members) {
      const t = totals.get(m.tag) ?? { name: m.name, lootedTotal: 0, weekends: 0 };
      t.lootedTotal += m.looted;
      if (m.attacks > 0) t.weekends += 1;
      totals.set(m.tag, t);
    }
  }
  const raiders: Raider[] = [...totals.entries()]
    .filter(([tag]) => inClan.has(tag) || latestByTag.has(tag))
    .map(([tag, t]) => {
      const l = latestByTag.get(tag);
      return {
        tag,
        name: t.name,
        inLatest: l !== undefined,
        attacks: l?.attacks ?? 0,
        attackLimit: l?.attackLimit ?? 0,
        looted: l?.looted ?? 0,
        lootedTotal: t.lootedTotal,
        weekends: t.weekends,
      };
    });

  const noActivity = latest ? api.clanMembers.filter((m) => !latestByTag.has(m.tag)) : [];

  return {
    unlocked: api.capitalHallLevel !== null || api.districts.length > 0,
    capital,
    weekend,
    history,
    raiders,
    noActivity,
    weekendsTracked: seasons.length,
  };
}
import type { CapitalStats, CwlStats, GamesStats, Member, Role, RuleBreak, WarStats } from "../types";

const DAY = 86_400_000;
const NOW = Date.now();

/** Tiny seeded RNG so the sample data is the same on every reload. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)] as T;
}
const daysAgoIso = (d: number): string => new Date(NOW - d * DAY).toISOString();

// The first 15 match the members in the Clan War page's sample war (same tags).
const SEED: { name: string; th: number; role: Role }[] = [
  { name: "Warchief_Rex", th: 16, role: "leader" },
  { name: "ShadowFang", th: 16, role: "coLeader" },
  { name: "IronMaiden", th: 16, role: "coLeader" },
  { name: "DragonSlayer", th: 15, role: "admin" },
  { name: "Nightbloom", th: 15, role: "member" },
  { name: "Valkyrie_K", th: 15, role: "admin" },
  { name: "StoneWall", th: 15, role: "member" },
  { name: "BlazeRunner", th: 14, role: "member" },
  { name: "Frostbite", th: 14, role: "admin" },
  { name: "Pixel_Pete", th: 14, role: "member" },
  { name: "GoblinKing", th: 14, role: "member" },
  { name: "RaidQueen", th: 13, role: "member" },
  { name: "Tinker", th: 13, role: "member" },
  { name: "BoomBoom", th: 13, role: "member" },
  { name: "LittleBob", th: 12, role: "member" },
  { name: "StormCaller", th: 14, role: "member" },
  { name: "NightOwl", th: 13, role: "member" },
  { name: "CrimsonTide", th: 13, role: "member" },
  { name: "Grimbold", th: 12, role: "member" },
  { name: "SilverArrow", th: 12, role: "member" },
  { name: "EmberWitch", th: 11, role: "member" },
  { name: "Thunderhoof", th: 11, role: "member" },
  { name: "MoonShade", th: 10, role: "member" },
  { name: "Rustblade", th: 10, role: "member" },
];

const OPPONENTS = ["Nordic Ravens", "Iron Legion", "Crimson Order", "Night's Watch", "Phoenix Rising"];
const DISTRICTS = [
  "Capital Peak",
  "Barbarian Camp",
  "Wizard Valley",
  "Balloon Lagoon",
  "Builder's Workshop",
  "Dragon Cliffs",
  "Golem Quarry",
  "Skeleton Park",
  "Goblin Mines",
];

interface Template {
  rule: string;
  severity: RuleBreak["severity"];
  detail: (r: () => number) => string;
}

const WAR_USE_ALL: Template = {
  rule: "Use all attacks",
  severity: "major",
  detail: (r) => `Left an attack unused vs ${pick(r, OPPONENTS)}`,
};
const WAR_OTHER: Template[] = [
  { rule: "Attack your mirror", severity: "minor", detail: (r) => `Hit ${2 + Math.floor(r() * 4)} ranks away from own position vs ${pick(r, OPPONENTS)}` },
  { rule: "Minimum stars", severity: "minor", detail: (r) => `First attack earned 1★ vs ${pick(r, OPPONENTS)}` },
  { rule: "Attack assigned base", severity: "minor", detail: (r) => `Hit #${1 + Math.floor(r() * 15)} instead of the assigned base` },
];

function breaks(r: () => number, prefix: string, count: number, first: Template | null, others: Template[], spanDays: number): RuleBreak[] {
  const out: RuleBreak[] = [];
  for (let i = 0; i < count; i++) {
    const t = i === 0 && first ? first : pick(r, others);
    out.push({
      id: `${prefix}-${i}`,
      rule: t.rule,
      severity: t.severity,
      detail: t.detail(r),
      date: daysAgoIso(Math.floor(r() * spanDays)),
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

function buildWar(r: () => number, skill: number): WarStats {
  const warsEligible = 14;
  const warsParticipated = 9 + Math.floor(r() * 6);
  const attacksAvailable = warsParticipated * 2;
  const missed = r() < 0.4 ? Math.floor(r() * 4) : 0;
  const attacksUsed = attacksAvailable - missed;
  const avg = clamp(1.35 + skill * 1.25 + (r() - 0.5) * 0.4, 0.8, 2.95);
  const stars = Math.round(attacksUsed * avg);
  const threeStars = Math.min(attacksUsed, Math.round(attacksUsed * clamp(0.15 + skill * 0.5 + (r() - 0.5) * 0.15, 0.05, 0.85)));
  const count = missed > 0 ? Math.min(missed, 3) + (r() < 0.3 ? 1 : 0) : r() < 0.2 ? 1 : 0;
  return {
    warsParticipated,
    warsEligible,
    attacksUsed,
    attacksAvailable,
    stars,
    threeStars,
    avgDestruction: Math.round(62 + skill * 28 + r() * 6),
    recentStars: Array.from({ length: 6 }, () => (r() < 0.12 ? null : clamp(Math.round(skill * 2.4 + r() * 3.4 - 0.5), 0, 6))),
    ruleBreaks: breaks(r, "war", count, missed > 0 ? WAR_USE_ALL : null, WAR_OTHER, 70),
  };
}

function buildCwl(r: () => number, skill: number, inLineup: boolean): CwlStats {
  const seasonsPlayed = 3 + Math.floor(r() * 10);
  const bonusesReceived = Math.floor(r() * seasonsPlayed * 0.7);
  if (!inLineup) {
    return {
      inLineup: false,
      seasonsPlayed,
      roundsPlayed: 0,
      attacksUsed: 0,
      starsThisSeason: 0,
      starsAllTime: Math.round(seasonsPlayed * (8 + skill * 6)),
      bonusHolder: false,
      bonusesReceived,
      ruleBreaks: [],
    };
  }
  const roundsPlayed = 3 + Math.floor(r() * 5);
  const missed = r() < 0.25 ? 1 : 0;
  const attacksUsed = roundsPlayed - missed;
  const starsThisSeason = Math.round(attacksUsed * clamp(1.7 + skill * 1.1 + (r() - 0.5) * 0.4, 1, 3));
  const list: RuleBreak[] = [];
  if (missed > 0) {
    list.push({
      id: "cwl-miss",
      rule: "Use all attacks",
      severity: "major",
      detail: `Missed the attack in round ${1 + Math.floor(r() * roundsPlayed)}`,
      date: daysAgoIso(3 + Math.floor(r() * 4)),
    });
  }
  if (r() < 0.15) {
    list.push({ id: "cwl-stars", rule: "Minimum stars", severity: "minor", detail: "Earned 1★ on a round-1 attack", date: daysAgoIso(8) });
  }
  return {
    inLineup: true,
    seasonsPlayed,
    roundsPlayed,
    attacksUsed,
    starsThisSeason,
    starsAllTime: starsThisSeason + Math.round((seasonsPlayed - 1) * (9 + skill * 6)),
    bonusHolder: missed === 0 && roundsPlayed >= 5,
    bonusesReceived,
    ruleBreaks: list,
  };
}

function buildCapital(r: () => number, skill: number): CapitalStats {
  const attackLimit = r() < 0.4 ? 6 : 5;
  const skipped = r() < 0.25 ? 1 + Math.floor(r() * 3) : 0;
  const attacksUsed = Math.max(0, attackLimit - skipped);
  const goldLooted = Math.round((attacksUsed * (3500 + skill * 5500 + r() * 1500)) / 10) * 10;

  const picked = [...DISTRICTS].sort(() => r() - 0.5).slice(0, 3 + Math.floor(r() * 4));
  const weights = picked.map(() => 0.4 + r());
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const base = (300_000 + r() * 1_900_000) * (0.5 + skill * 0.7);
  const contributions = picked
    .map((district, i) => ({ district, amount: Math.round((base * (weights[i] ?? 1)) / weightSum / 100) * 100 }))
    .sort((a, b) => b.amount - a.amount);
  const goldContributedTotal = contributions.reduce((s, c) => s + c.amount, 0);

  const list: RuleBreak[] = [];
  if (skipped > 0) {
    list.push({
      id: "cap-skip",
      rule: "Use all raid attacks",
      severity: "major",
      detail: `Skipped ${skipped} raid attack${skipped === 1 ? "" : "s"} last weekend`,
      date: daysAgoIso(4 + Math.floor(r() * 3)),
    });
  }
  if (goldContributedTotal < 450_000 && r() < 0.5) {
    list.push({
      id: "cap-contrib",
      rule: "Minimum capital contribution",
      severity: "minor",
      detail: "Below the clan's minimum contribution for this season",
      date: daysAgoIso(10),
    });
  }

  return {
    raidsParticipated: 6 + Math.floor(r() * 5),
    raidsEligible: 10,
    attacksUsed,
    attackLimit,
    goldLooted,
    goldContributedTotal,
    contributions,
    ruleBreaks: list,
  };
}

function buildGames(r: () => number): GamesStats {
  const event = (): number => (r() < 0.2 ? Math.floor(r() * 600) : r() < 0.5 ? 4000 : Math.floor(1500 + r() * 2400));
  return { clanGamesPoints: event(), clanGamesHistory: [event(), event(), event(), event()] };
}

function buildMembers(): Member[] {
  return SEED.map((s, i) => {
    const r = rng(1000 + i * 77);
    const skill = clamp((s.th - 9) / 7, 0, 1);
    return {
      tag: i < 15 ? `#A${i + 1}` : `#M${i + 1}`,
      name: s.name,
      role: s.role,
      townHallLevel: s.th,
      trophies: Math.round(4200 + skill * 1300 + r() * 200),
      donations: Math.round((200 + r() * 2800) * (0.6 + skill * 0.7)),
      donationsReceived: Math.round(100 + r() * 2200),
      joinedAt: daysAgoIso(30 + Math.floor(r() * 900)),
      war: buildWar(r, skill),
      cwl: buildCwl(r, skill, i < 18),
      capital: buildCapital(r, skill),
      games: buildGames(r),
    };
  });
}

export const mockMembers: Member[] = buildMembers();
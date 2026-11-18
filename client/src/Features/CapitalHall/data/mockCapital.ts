import type { CapitalInfo, RaidHistoryItem } from "../types";

const DAY = 86_400_000;
const NOW = Date.now();

// Sample numbers — swap for real data from /clans/{tag}.
export const mockCapital: CapitalInfo = {
  hallLevel: 10,
  hallMaxLevel: 10,
  districts: [
    { id: 1, name: "Capital Peak", level: 10, maxLevel: 10, nextCost: null },
    { id: 2, name: "Barbarian Camp", level: 5, maxLevel: 5, nextCost: null },
    { id: 3, name: "Wizard Valley", level: 5, maxLevel: 5, nextCost: null },
    { id: 4, name: "Balloon Lagoon", level: 4, maxLevel: 5, nextCost: 180_000 },
    { id: 5, name: "Builder's Workshop", level: 4, maxLevel: 5, nextCost: 180_000 },
    { id: 6, name: "Dragon Cliffs", level: 4, maxLevel: 5, nextCost: 210_000 },
    { id: 7, name: "Golem Quarry", level: 4, maxLevel: 5, nextCost: 210_000 },
    { id: 8, name: "Skeleton Park", level: 3, maxLevel: 5, nextCost: 140_000 },
    { id: 9, name: "Goblin Mines", level: 3, maxLevel: 5, nextCost: 140_000 },
  ],
};

const label = (daysAgo: number): string => new Date(NOW - daysAgo * DAY).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** The last 5 finished raid weekends, oldest first. */
export const mockRaidHistory: RaidHistoryItem[] = [
  { label: label(35), totalLoot: 318_400, medals: 4_380 },
  { label: label(28), totalLoot: 352_900, medals: 4_910 },
  { label: label(21), totalLoot: 296_100, medals: 4_020 },
  { label: label(14), totalLoot: 401_700, medals: 5_640 },
  { label: label(7), totalLoot: 377_300, medals: 5_210 },
];

export const mockEnemies = [
  { name: "Iron Legion", level: 21, districtCount: 9, districtsDestroyed: 6, share: 0.4 },
  { name: "Crimson Order", level: 18, districtCount: 8, districtsDestroyed: 5, share: 0.3 },
  { name: "Night's Watch", level: 19, districtCount: 8, districtsDestroyed: 3, share: 0.2 },
  { name: "Phoenix Rising", level: 16, districtCount: 6, districtsDestroyed: 2, share: 0.1 },
];

export const WEEKEND_START = NOW - 20 * 3_600_000;
export const WEEKEND_END = WEEKEND_START + 72 * 3_600_000;
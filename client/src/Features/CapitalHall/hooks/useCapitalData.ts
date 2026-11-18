import { useMemo } from "react";
import { useMembers } from "../../Members/hooks/useMembers";
import { WEEKEND_END, WEEKEND_START, mockCapital, mockEnemies, mockRaidHistory } from "../data/mockCapital";
import type { RaidWeekend } from "../types";

/**
 * The raid weekend is built from the same member data as the Members page,
 * so the two pages always agree. With real data this comes straight from
 * /clans/{tag}/capitalraidseasons instead.
 */
export function useCapitalData() {
  const { members, isSample } = useMembers();

  return useMemo(() => {
    const totalLoot = members.reduce((s, m) => s + m.capital.goldLooted, 0);
    const totalAttacks = members.reduce((s, m) => s + m.capital.attacksUsed, 0);
    const attackLimit = members.reduce((s, m) => s + m.capital.attackLimit, 0);

    let remaining = totalAttacks;
    const attackLog = mockEnemies.map((e, i) => {
      const attackCount = i === mockEnemies.length - 1 ? remaining : Math.round(totalAttacks * e.share);
      remaining -= attackCount;
      return { name: e.name, level: e.level, districtCount: e.districtCount, districtsDestroyed: e.districtsDestroyed, attackCount };
    });

    const weekend: RaidWeekend = {
      state: "ongoing",
      startTime: new Date(WEEKEND_START).toISOString(),
      endTime: new Date(WEEKEND_END).toISOString(),
      capitalTotalLoot: totalLoot,
      totalAttacks,
      attackLimit,
      enemyDistrictsDestroyed: attackLog.reduce((s, e) => s + e.districtsDestroyed, 0),
      offensiveReward: 5_120,
      defensiveReward: 640,
      attackLog,
    };

    return { capital: mockCapital, weekend, history: mockRaidHistory, members, isSample };
  }, [members, isSample]);
}
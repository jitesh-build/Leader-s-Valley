import { useMemo } from "react";
import { useClanData } from "../../../lib/ClanDataProvider";
import { useClanRoster } from "../../../lib/useClanRoster";
import { useLiveWar } from "../../ClanWars/hooks/useLiveWar";
import { useRules } from "../../ClanWars/hooks/useRules";
import { evaluateRules } from "../../ClanWars/rules/engine";
import type { RoleMember } from "../types";

/**
 * The live roster for the Roles page: roles, town halls and season donations from the game, plus
 * attacks in the current war / latest raid weekend, plus how many rules each player broke in the current war
 * (the rules from the Clan War page, run on the live war).
 */
export function useRoleMembers() {
  const { clanTag } = useClanData();
  const roster = useClanRoster(clanTag);
  const war = useLiveWar({ clanTag, source: "war" });
  const { rules } = useRules();

  /** tag -> rules broken in the current war. null when there is no war in battle to check. */
  const breaksByTag = useMemo(() => {
    const w = war.war;
    if (!w || w.state === "preparation") return null;
    const map = new Map<string, number>();
    for (const v of evaluateRules(w, rules, { now: new Date() })) {
      if (v.status === "violated") map.set(v.memberTag, (map.get(v.memberTag) ?? 0) + 1);
    }
    return map;
  }, [war.war, rules]);

  const members = useMemo<RoleMember[]>(
    () =>
      (roster.data?.members ?? []).map((m) => ({
        tag: m.tag,
        name: m.name,
        role: m.role === "elder" ? "admin" : m.role,
        townHallLevel: m.townHallLevel ?? 1,
        donations: m.donations,
        donationsReceived: m.donationsReceived,
        war: m.war ? { attacksUsed: m.war.attacksUsed, attacksAvailable: m.war.attacksAvailable } : null,
        raid: m.raid ? { attacksUsed: m.raid.attacksUsed, attackLimit: m.raid.attackLimit } : null,
        // only players who were in the war can have broken its rules
        ruleBreaks: breaksByTag && m.war ? (breaksByTag.get(m.tag) ?? 0) : null,
        joinedAt: null,
        warsParticipated: null,
        warsEligible: null,
        clanGamesPoints: null,
      })),
    [roster.data, breaksByTag]
  );

  return {
    clanTag,
    members,
    loading: roster.loading,
    refreshing: roster.refreshing,
    error: roster.error,
    updatedAt: roster.updatedAt,
    refresh: roster.refresh,
  };
}
import { Coins, Eye, Gamepad2, Gift, Landmark, Medal, ShieldAlert, Star, Swords, Target, Users } from "lucide-react";
import type { Stat } from "../Home/types";
import { formatNumber } from "./format";
import type { Member, TabId } from "./types";

const sum = (list: Member[], f: (m: Member) => number): number => list.reduce((s, m) => s + f(m), 0);

export function buildSummary(tab: TabId, all: Member[], watchCount: number): Stat[] {
  switch (tab) {
    case "war": {
      const breakers = all.filter((m) => m.war.ruleBreaks.length > 0).length;
      const attacksUsed = sum(all, (m) => m.war.attacksUsed);
      const attacksAvail = sum(all, (m) => m.war.attacksAvailable);
      return [
        { label: "Clan members", value: String(all.length), suffix: "/ 50", sub: `${all.filter((m) => m.war.warsParticipated > 0).length} have fought in wars`, icon: Users, tone: "gold" },
        { label: "War stars", value: formatNumber(sum(all, (m) => m.war.stars)), sub: `${sum(all, (m) => m.war.threeStars)} three-star hits`, icon: Star, tone: "blue" },
        { label: "Attacks used", value: attacksAvail ? `${Math.round((attacksUsed / attacksAvail) * 100)}%` : "—", sub: `${attacksAvail - attacksUsed} missed attacks`, icon: Swords, tone: "purple" },
        { label: "Rule breakers", value: String(breakers), sub: `${sum(all, (m) => m.war.ruleBreaks.length)} breaks on record`, icon: ShieldAlert, tone: "red" },
      ];
    }
    case "cwl": {
      const lineup = all.filter((m) => m.cwl.inLineup);
      return [
        { label: "CWL stars", value: String(sum(all, (m) => m.cwl.starsThisSeason)), sub: `${formatNumber(sum(all, (m) => m.cwl.starsAllTime))} all-time`, icon: Star, tone: "blue" },
        { label: "In lineup", value: String(lineup.length), suffix: `/ ${all.length}`, sub: "this season", icon: Users, tone: "gold" },
        { label: "Bonus holders", value: String(all.filter((m) => m.cwl.bonusHolder).length), sub: `${sum(all, (m) => m.cwl.bonusesReceived)} given in past seasons`, icon: Medal, tone: "purple" },
        { label: "Rule breakers", value: String(all.filter((m) => m.cwl.ruleBreaks.length > 0).length), sub: `${sum(all, (m) => m.cwl.ruleBreaks.length)} breaks this season`, icon: ShieldAlert, tone: "red" },
      ];
    }
    case "capital": {
      const used = sum(all, (m) => m.capital.attacksUsed);
      const limit = sum(all, (m) => m.capital.attackLimit);
      const looted = sum(all, (m) => m.capital.goldLooted);
      const top = [...all].sort((a, b) => b.capital.goldContributedTotal - a.capital.goldContributedTotal)[0];
      return [
        { label: "Raid attacks", value: String(used), suffix: `/ ${limit}`, sub: `${limit - used} unused`, icon: Target, tone: "gold" },
        { label: "Gold looted", value: formatNumber(looted), sub: used ? `${formatNumber(Math.round(looted / used))} per attack` : "—", icon: Landmark, tone: "purple" },
        { label: "Gold contributed", value: formatNumber(sum(all, (m) => m.capital.goldContributedTotal)), sub: top ? `Top: ${top.name}` : "—", icon: Coins, tone: "blue" },
        { label: "Rule breakers", value: String(all.filter((m) => m.capital.ruleBreaks.length > 0).length), sub: `${sum(all, (m) => m.capital.ruleBreaks.length)} breaks on record`, icon: ShieldAlert, tone: "red" },
      ];
    }
    case "other": {
      const given = sum(all, (m) => m.donations);
      const received = sum(all, (m) => m.donationsReceived);
      return [
        { label: "Clan games", value: formatNumber(sum(all, (m) => m.games.clanGamesPoints)), sub: `${all.filter((m) => m.games.clanGamesPoints >= 4000).length} maxed at 4,000`, icon: Gamepad2, tone: "gold" },
        { label: "Donations", value: formatNumber(given), sub: `${formatNumber(received)} received`, icon: Gift, tone: "blue" },
        { label: "Donation ratio", value: received ? (given / received).toFixed(2) : "—", sub: "clan-wide, given ÷ received", subTone: received && given >= received ? "green" : "muted", icon: Gift, tone: "purple" },
        { label: "Watch list", value: String(watchCount), sub: "flagged by leaders", icon: Eye, tone: "red" },
      ];
    }
  }
}
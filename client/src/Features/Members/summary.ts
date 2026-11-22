import { Eye, Gift, Landmark, Medal, ShieldAlert, Star, Swords, Target, Trophy, Users } from "lucide-react";
import type { Stat } from "../Home/types";
import { formatNumber } from "./format";
import type { Member, MembersData, TabId } from "./types";

const sum = (list: Member[], f: (m: Member) => number): number => list.reduce((s, m) => s + f(m), 0);

export interface SummaryContext {
  data: MembersData | null;
  watchCount: number;
  /** Players a leader marked as CWL bonus holders. */
  bonusCount: number;
  /** Members with a live rule broken / at risk in the current war (from the Clan War page's rules). */
  liveBroken: number;
  liveAtRisk: number;
}

/** The four cards under the tabs. Only numbers the game really provides. */
export function buildSummary(tab: TabId, all: Member[], ctx: SummaryContext): Stat[] {
  switch (tab) {
    case "war": {
      const inWar = all.filter((m) => m.war !== null);
      const used = sum(all, (m) => m.war?.attacksUsed ?? 0);
      const avail = sum(all, (m) => m.war?.attacksAvailable ?? 0);
      const ended = ctx.data?.war?.state === "warEnded";
      return [
        { label: "Clan members", value: String(all.length), suffix: "/ 50", sub: ctx.data?.war ? `${inWar.length} in this war` : "No war right now", icon: Users, tone: "gold" },
        { label: "War stars", value: ctx.data?.war ? formatNumber(sum(all, (m) => m.war?.stars ?? 0)) : "—", sub: ctx.data?.war ? `${sum(all, (m) => m.war?.threeStars ?? 0)} three-star hits` : "Starts with the next war", icon: Star, tone: "blue" },
        { label: "Attacks used", value: avail ? `${Math.round((used / avail) * 100)}%` : "—", sub: avail ? `${avail - used} attacks ${ended ? "missed" : "left"}` : ctx.data?.war?.state === "preparation" ? "Opens on battle day" : "Not in a war", icon: Swords, tone: "purple" },
        { label: "Rule breakers", value: String(ctx.liveBroken), sub: `${ctx.liveAtRisk} at risk`, icon: ShieldAlert, tone: "red" },
      ];
    }
    case "cwl": {
      const registered = all.filter((m) => m.cwl.registered).length;
      const playing = all.filter((m) => m.cwl.roundsPlayed > 0).length;
      const missed = sum(all, (m) => m.cwl.missedAttacks);
      return [
        { label: "CWL stars", value: ctx.data?.cwl ? String(sum(all, (m) => m.cwl.starsThisSeason)) : "—", sub: ctx.data?.cwl ? `Season ${ctx.data.cwl.season ?? "?"}` : "Not in CWL right now", icon: Star, tone: "blue" },
        { label: "In lineup", value: String(playing), suffix: `/ ${registered}`, sub: "registered for this CWL", icon: Users, tone: "gold" },
        { label: "Bonus holders", value: String(ctx.bonusCount), sub: "marked by you", icon: Medal, tone: "purple" },
        { label: "Missed attacks", value: String(missed), sub: `${all.filter((m) => m.cwl.missedAttacks > 0).length} players`, icon: ShieldAlert, tone: "red" },
      ];
    }
    case "capital": {
      const used = sum(all, (m) => m.capital.raid?.attacksUsed ?? 0);
      const limit = sum(all, (m) => m.capital.raid?.attackLimit ?? 0);
      const looted = sum(all, (m) => m.capital.raid?.looted ?? 0);
      const raiders = all.filter((m) => (m.capital.raid?.attacksUsed ?? 0) > 0).length;
      const missed = sum(all, (m) => m.capital.missedLastWeekend ?? 0);
      return [
        { label: "Raid attacks", value: String(used), suffix: `/ ${limit}`, sub: ctx.data?.raid ? `${limit - used} unused` : "No raid weekend yet", icon: Target, tone: "gold" },
        { label: "Gold looted", value: formatNumber(looted), sub: used ? `${formatNumber(Math.round(looted / used))} per attack` : "—", icon: Landmark, tone: "purple" },
        { label: "Raiders", value: String(raiders), suffix: `/ ${all.length}`, sub: "attacked this weekend", icon: Users, tone: "blue" },
        { label: "Missed attacks", value: ctx.data?.raid?.state === "ended" ? String(missed) : "—", sub: ctx.data?.raid?.state === "ended" ? "last weekend" : "counted when the weekend ends", icon: ShieldAlert, tone: "red" },
      ];
    }
    case "other": {
      const given = sum(all, (m) => m.donations);
      const received = sum(all, (m) => m.donationsReceived);
      const top = [...all].sort((a, b) => b.trophies - a.trophies)[0];
      return [
        { label: "Donations", value: formatNumber(given), sub: `${formatNumber(received)} received`, icon: Gift, tone: "gold" },
        { label: "Donation ratio", value: received ? (given / received).toFixed(2) : "—", sub: "clan-wide, given ÷ received", subTone: received && given >= received ? "green" : "muted", icon: Gift, tone: "blue" },
        { label: "Average trophies", value: all.length ? formatNumber(Math.round(sum(all, (m) => m.trophies) / all.length)) : "—", sub: top ? `Top: ${top.name}` : "—", icon: Trophy, tone: "purple" },
        { label: "Watch list", value: String(ctx.watchCount), sub: "flagged by leaders", icon: Eye, tone: "red" },
      ];
    }
  }
}
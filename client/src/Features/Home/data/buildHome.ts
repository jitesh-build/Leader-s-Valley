import { Landmark, ShieldCheck, Swords, UserPlus } from "lucide-react";
import type { ApiOverview } from "../../../lib/clashApi";
import type { HealthMetric, NavBadge, Stat } from "../types";

const MAX_MEMBERS = 50;

/** "Dark Exiles" -> "DE" */
export function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return letters || "?";
}

/** The four cards at the top of the Home page. `null` = still loading, so cards show "—". */
export function buildStats(o: ApiOverview | null): Stat[] {
  if (!o) {
    return [
      { label: "Clan members", value: "—", sub: "Loading…", icon: UserPlus, tone: "gold" },
      { label: "War win rate", value: "—", sub: "Loading…", icon: Swords, tone: "red" },
      { label: "Capital Hall", value: "—", sub: "Loading…", icon: Landmark, tone: "purple" },
      { label: "CWL league", value: "—", sub: "Loading…", icon: ShieldCheck, tone: "blue" },
    ];
  }

  const { clan, members, capital, cwl } = o;

  // War win rate (needs the clan's war log to be public, otherwise the game hides the numbers)
  const games = clan.war.wins + clan.war.losses + clan.war.ties;
  let winRate: Stat;
  if (!clan.isWarLogPublic) {
    winRate = { label: "War win rate", value: "—", sub: "War log is private", icon: Swords, tone: "red" };
  } else if (games === 0) {
    winRate = { label: "War win rate", value: "—", sub: "No wars yet", icon: Swords, tone: "red" };
  } else {
    const rate = Math.round((clan.war.wins / games) * 100);
    winRate = {
      label: "War win rate",
      value: `${rate}%`,
      sub: `${clan.war.wins} wins · ${clan.war.losses} losses${clan.war.winStreak >= 2 ? ` · ${clan.war.winStreak} streak` : ""}`,
      subTone: rate >= 60 ? "green" : "muted",
      icon: Swords,
      tone: "red",
    };
  }

  return [
    {
      label: "Clan members",
      value: String(clan.memberCount),
      suffix: `/ ${MAX_MEMBERS}`,
      sub: members.averageTownHall !== null ? `Average town hall ${members.averageTownHall}` : "No members found",
      subTone: "muted",
      icon: UserPlus,
      tone: "gold",
    },
    winRate,
    {
      label: "Capital Hall",
      value: capital.hallLevel !== null ? `Level ${capital.hallLevel}` : "—",
      sub:
        capital.hallLevel !== null
          ? `${capital.districtCount} district${capital.districtCount === 1 ? "" : "s"}${capital.league ? ` · ${capital.league}` : ""}`
          : "Capital not unlocked",
      subTone: "muted",
      icon: Landmark,
      tone: "purple",
    },
    {
      label: "CWL league",
      value: clan.leagueTier ?? clan.warLeague ?? "Unranked",
      sub: cwl ? `Season ${cwl.season ?? "?"}${cwl.round ? ` · round ${cwl.round}` : ""}` : "Not in CWL right now",
      subTone: cwl ? "green" : "muted",
      icon: ShieldCheck,
      tone: "blue",
    },
  ];
}

export interface HealthView {
  score: number | null;
  title: string;
  text: string;
  metrics: HealthMetric[];
}

/** Score -> headline. */
function healthWords(score: number | null): { title: string; text: string } {
  if (score === null) return { title: "Not enough data", text: "Health shows up once there's activity to measure." };
  if (score >= 85) return { title: "Battle ready", text: "Everything is looking sharp." };
  if (score >= 70) return { title: "In good shape", text: "A few things could be tighter." };
  if (score >= 50) return { title: "Needs attention", text: "Some areas are falling behind." };
  return { title: "Falling behind", text: "Time for a clan pep talk." };
}

export function buildHealth(o: ApiOverview | null): HealthView {
  if (!o) {
    return {
      score: null,
      title: "Loading…",
      text: "Checking the clan's numbers.",
      metrics: [
        { label: "Donations", value: null },
        { label: "Capital raids", value: null },
        { label: "War attacks", value: null },
      ],
    };
  }
  return {
    score: o.health.score,
    ...healthWords(o.health.score),
    metrics: o.health.metrics.map((m) => ({ label: m.label, value: m.value, detail: m.detail })),
  };
}

/** Badges for the sidebar links, keyed by route path. */
export function buildNavBadges(o: ApiOverview | null): Record<string, NavBadge> {
  const badges: Record<string, NavBadge> = {};
  if (!o) return badges;

  if (o.war?.kind === "war") {
    if (o.war.state === "inWar") badges["/clan-wars"] = { text: "LIVE", variant: "live", title: "A war is being fought" };
    else if (o.war.state === "preparation") badges["/clan-wars"] = { text: "PREP", variant: "prep", title: "War preparation day" };
  }
  if (o.cwl?.round) badges["/cwl"] = { text: String(o.cwl.round), variant: "count", title: `CWL round ${o.cwl.round}` };
  return badges;
}

export interface SeasonView {
  daysLeft: number;
  /** 0-100: how much of the season has passed. */
  percent: number;
  endLabel: string;
}

/** Progress through the current season (Gold Pass season dates). null if unknown. */
export function buildSeason(o: ApiOverview | null, now = Date.now()): SeasonView | null {
  const start = o?.season?.startTime ? Date.parse(o.season.startTime) : NaN;
  const end = o?.season?.endTime ? Date.parse(o.season.endTime) : NaN;
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return {
    daysLeft: Math.max(0, Math.ceil((end - now) / 86_400_000)),
    percent: Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100))),
    endLabel: new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}

/** "08h 42m" (hours can be 3 digits for long timers). */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}
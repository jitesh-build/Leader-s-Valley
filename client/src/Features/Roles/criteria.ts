import { formatNumber } from "../Members/format";
import { daysSince } from "../Members/format";
import type { Member, Role } from "../Members/types";
import type { CriterionResult, PromotionSuggestion, ReviewSuggestion, RoleCriteria } from "./types";

export const DEFAULT_CRITERIA: RoleCriteria = {
  minParticipation: 70,
  minAttackUse: 90,
  maxBreaks: 1,
  minDonations: 500,
  minRatio: 1,
  minClanGames: 2000,
  minTenureElder: 60,
  minTenureCo: 180,
  reviewBreaks: 3,
  reviewParticipation: 70,
};

const PROMOTE: Partial<Record<Role, Role>> = { member: "admin", admin: "coLeader" };
const DEMOTE: Partial<Record<Role, Role>> = { coLeader: "admin", admin: "member" };

export const promotionTarget = (r: Role): Role | null => PROMOTE[r] ?? null;
export const demotionTarget = (r: Role): Role | null => DEMOTE[r] ?? null;

export const totalBreaks = (m: Member): number => m.war.ruleBreaks.length + m.cwl.ruleBreaks.length + m.capital.ruleBreaks.length;
const participation = (m: Member): number => Math.round((m.war.warsParticipated / Math.max(1, m.war.warsEligible)) * 100);
const attackUse = (m: Member): number => (m.war.attacksAvailable ? Math.round((m.war.attacksUsed / m.war.attacksAvailable) * 100) : 0);
const ratio = (m: Member): number => (m.donationsReceived > 0 ? m.donations / m.donationsReceived : m.donations);

/** Every check a member must pass to be promoted, with a human-readable result for each. */
export function evaluatePromotion(m: Member, c: RoleCriteria): PromotionSuggestion | null {
  const to = promotionTarget(m.role);
  if (!to) return null;

  const days = daysSince(m.joinedAt);
  const needDays = to === "coLeader" ? c.minTenureCo : c.minTenureElder;
  const part = participation(m);
  const use = attackUse(m);
  const breaks = totalBreaks(m);
  const r = ratio(m);

  const results: CriterionResult[] = [
    { id: "participation", label: "War participation", pass: part >= c.minParticipation, detail: `${part}% of wars (needs ${c.minParticipation}%)` },
    { id: "attacks", label: "Attacks used", pass: use >= c.minAttackUse, detail: `${use}% of attacks used (needs ${c.minAttackUse}%)` },
    { id: "breaks", label: "Rule breaks", pass: breaks <= c.maxBreaks, detail: `${breaks} on record (max ${c.maxBreaks})` },
    {
      id: "donations",
      label: "Donations",
      pass: m.donations >= c.minDonations && r >= c.minRatio,
      detail: `${formatNumber(m.donations)} donated, ratio ${r.toFixed(2)} (needs ${formatNumber(c.minDonations)} and ${c.minRatio.toFixed(1)}+)`,
    },
    { id: "games", label: "Clan games", pass: m.games.clanGamesPoints >= c.minClanGames, detail: `${formatNumber(m.games.clanGamesPoints)} points (needs ${formatNumber(c.minClanGames)})` },
    { id: "tenure", label: "Time in clan", pass: days >= needDays, detail: `${days} days (needs ${needDays})` },
  ];

  const failing = results.filter((x) => !x.pass);
  return { member: m, to, results, failing, ready: failing.length === 0 };
}

/** Elders / Co-leaders who've slipped enough that a leader should take a look. */
export function evaluateReview(m: Member, c: RoleCriteria): ReviewSuggestion | null {
  const to = demotionTarget(m.role);
  if (!to) return null;
  const reasons: string[] = [];
  const breaks = totalBreaks(m);
  const part = participation(m);
  if (breaks >= c.reviewBreaks) reasons.push(`${breaks} rule breaks on record (flagged at ${c.reviewBreaks}+)`);
  if (part < c.reviewParticipation) reasons.push(`Only ${part}% war participation (flagged below ${c.reviewParticipation}%)`);
  return reasons.length > 0 ? { member: m, to, reasons } : null;
}

/** Ready members first, then "almost" (one check short), fewest failures first. */
export function buildPromotions(members: Member[], c: RoleCriteria): PromotionSuggestion[] {
  return members
    .map((m) => evaluatePromotion(m, c))
    .filter((s): s is PromotionSuggestion => s !== null && s.failing.length <= 1)
    .sort((a, b) => a.failing.length - b.failing.length || a.member.name.localeCompare(b.member.name));
}

export function buildReviews(members: Member[], c: RoleCriteria): ReviewSuggestion[] {
  return members
    .map((m) => evaluateReview(m, c))
    .filter((s): s is ReviewSuggestion => s !== null)
    .sort((a, b) => b.reasons.length - a.reasons.length);
}
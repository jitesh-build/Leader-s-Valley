import type { CriterionResult, PromotionSuggestion, ReviewSuggestion, Role, RoleCriteria, RoleMember } from "./types";

export const DEFAULT_CRITERIA: RoleCriteria = {
  minParticipation: 70,
  minAttackUse: 90,
  minRaidUse: 80,
  maxBreaks: 1,
  minDonations: 500,
  minRatio: 1,
  minClanGames: 2000,
  minTenureElder: 60,
  minTenureCo: 180,
  reviewBreaks: 3,
  reviewParticipation: 70,
  reviewAttackUse: 50,
  reviewDonations: 100,
};

/** A promotion is only suggested when at least this many checks have real data behind them. */
export const MIN_KNOWN_CHECKS = 2;

const PROMOTE: Partial<Record<Role, Role>> = { member: "admin", admin: "coLeader" };
const DEMOTE: Partial<Record<Role, Role>> = { coLeader: "admin", admin: "member" };

export const promotionTarget = (r: Role): Role | null => PROMOTE[r] ?? null;
export const demotionTarget = (r: Role): Role | null => DEMOTE[r] ?? null;

const formatNumber = (n: number): string => n.toLocaleString("en-US");
const pct = (part: number, whole: number): number | null => (whole > 0 ? Math.round((part / whole) * 100) : null);
const ratio = (m: RoleMember): number => (m.donationsReceived > 0 ? m.donations / m.donationsReceived : m.donations);

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 86_400_000));
}

/** A check on one number; no number = "unknown" (skipped). */
function check(
  id: string,
  label: string,
  value: number | null,
  passes: (v: number) => boolean,
  detail: (v: number) => string,
  whenUnknown: string
): CriterionResult {
  if (value === null) return { id, label, status: "unknown", detail: whenUnknown };
  return { id, label, status: passes(value) ? "pass" : "fail", detail: detail(value) };
}

/** Every check a member must pass to be promoted. Checks the game gives no data for are marked "unknown" and skipped. */
export function evaluatePromotion(m: RoleMember, c: RoleCriteria): PromotionSuggestion | null {
  const to = promotionTarget(m.role);
  if (!to) return null;

  const needDays = to === "coLeader" ? c.minTenureCo : c.minTenureElder;
  const part = m.warsParticipated !== null && m.warsEligible !== null ? pct(m.warsParticipated, m.warsEligible) : null;
  const use = m.war ? pct(m.war.attacksUsed, m.war.attacksAvailable) : null;
  const raidUse = m.raid ? pct(m.raid.attacksUsed, m.raid.attackLimit) : null;
  const days = m.joinedAt ? daysSince(m.joinedAt) : null;
  const r = ratio(m);

  const results: CriterionResult[] = [
    check("participation", "War participation", part, (v) => v >= c.minParticipation, (v) => `${v}% of wars (needs ${c.minParticipation}%)`, "The game keeps no war history"),
    check("attacks", "Attacks used (current war)", use, (v) => v >= c.minAttackUse, (v) => `${v}% of attacks used (needs ${c.minAttackUse}%)`, "Not in the current war"),
    check("raids", "Raid attacks used", raidUse, (v) => v >= c.minRaidUse, (v) => `${v}% of raid attacks used (needs ${c.minRaidUse}%)`, "Not listed in the latest raid weekend"),
    check("breaks", "Rule breaks (current war)", m.ruleBreaks, (v) => v <= c.maxBreaks, (v) => `${v} this war (max ${c.maxBreaks})`, "No war to check"),
    {
      id: "donations",
      label: "Donations",
      status: m.donations >= c.minDonations && r >= c.minRatio ? "pass" : "fail",
      detail: `${formatNumber(m.donations)} donated this season, ratio ${r.toFixed(2)} (needs ${formatNumber(c.minDonations)} and ${c.minRatio.toFixed(1)}+)`,
    },
    check("games", "Clan games", m.clanGamesPoints, (v) => v >= c.minClanGames, (v) => `${formatNumber(v)} points (needs ${formatNumber(c.minClanGames)})`, "The game gives no per-player clan games points"),
    check("tenure", "Time in clan", days, (v) => v >= needDays, (v) => `${v} days (needs ${needDays})`, "The game doesn't say when someone joined"),
  ];

  const failing = results.filter((x) => x.status === "fail");
  const unknown = results.filter((x) => x.status === "unknown");
  const known = results.length - unknown.length;
  return { member: m, to, results, failing, unknown, ready: known >= MIN_KNOWN_CHECKS && failing.length === 0 };
}

/** Elders / Co-leaders whose numbers have slipped enough that a leader should take a look. Only uses data that exists. */
export function evaluateReview(m: RoleMember, c: RoleCriteria): ReviewSuggestion | null {
  const to = demotionTarget(m.role);
  if (!to) return null;

  const reasons: string[] = [];
  if (m.ruleBreaks !== null && m.ruleBreaks >= c.reviewBreaks) reasons.push(`${m.ruleBreaks} rules broken in the current war (flagged at ${c.reviewBreaks}+)`);

  const part = m.warsParticipated !== null && m.warsEligible !== null ? pct(m.warsParticipated, m.warsEligible) : null;
  if (part !== null && part < c.reviewParticipation) reasons.push(`Only ${part}% war participation (flagged below ${c.reviewParticipation}%)`);

  const use = m.war ? pct(m.war.attacksUsed, m.war.attacksAvailable) : null;
  if (use !== null && use < c.reviewAttackUse) reasons.push(`Used only ${use}% of attacks in the current war (flagged below ${c.reviewAttackUse}%)`);

  if (m.donations < c.reviewDonations) reasons.push(`Donated only ${formatNumber(m.donations)} this season (flagged below ${formatNumber(c.reviewDonations)})`);

  return reasons.length > 0 ? { member: m, to, reasons } : null;
}

/** Ready members first, then "almost" (one check short), fewest failures first. */
export function buildPromotions(members: RoleMember[], c: RoleCriteria): PromotionSuggestion[] {
  return members
    .map((m) => evaluatePromotion(m, c))
    .filter((s): s is PromotionSuggestion => s !== null && s.results.length - s.unknown.length >= MIN_KNOWN_CHECKS && s.failing.length <= 1)
    .sort((a, b) => a.failing.length - b.failing.length || a.member.name.localeCompare(b.member.name));
}

export function buildReviews(members: RoleMember[], c: RoleCriteria): ReviewSuggestion[] {
  return members
    .map((m) => evaluateReview(m, c))
    .filter((s): s is ReviewSuggestion => s !== null)
    .sort((a, b) => b.reasons.length - a.reasons.length);
}
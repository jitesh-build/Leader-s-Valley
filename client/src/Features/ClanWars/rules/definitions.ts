import type { WarAttack, WarMember } from "../types";
import { formatHours } from "../format";
import type { EvalContext, ParamDef, Rule, RuleParams, RuleTypeId, Severity, Violation, ViolationStatus } from "./types";

export interface RuleTypeDef {
  id: RuleTypeId;
  label: string;
  blurb: string;
  params: ParamDef[];
  defaults: RuleParams;
  /** Human sentence for a given set of params — also used as the default rule title. */
  describe: (p: RuleParams) => string;
  /** Pure function: war data in, violations out. Safe to move to the backend as-is. */
  evaluate: (ctx: EvalContext, rule: Rule) => Violation[];
}

const num = (p: RuleParams, key: string): number => Number(p[key]);
const str = (p: RuleParams, key: string): string => String(p[key]);
const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

function makeViolation(
  rule: Rule,
  member: WarMember,
  status: ViolationStatus,
  message: string,
  attack?: WarAttack
): Violation {
  return {
    id: `${rule.id}:${member.tag}:${attack?.order ?? "war"}`,
    ruleId: rule.id,
    ruleTitle: rule.title,
    severity: rule.severity as Severity,
    memberTag: member.tag,
    memberName: member.name,
    memberPosition: member.mapPosition,
    status,
    message,
    ...(attack ? { attackOrder: attack.order } : {}),
  };
}

/** A member's attacks in the order they were made, filtered to the ones a rule applies to. */
function pickAttacks(member: WarMember, appliesTo: string): { attack: WarAttack; index: number }[] {
  const sorted = [...member.attacks].sort((a, b) => a.order - b.order).map((attack, index) => ({ attack, index }));
  if (appliesTo === "first") return sorted.slice(0, 1);
  if (appliesTo === "second") return sorted.slice(1, 2);
  return sorted;
}

const APPLIES_FIRST_ALL = [
  { value: "first", label: "First attack only" },
  { value: "all", label: "Every attack" },
];
const APPLIES_FIRST_SECOND_ALL = [
  { value: "first", label: "First attack only" },
  { value: "second", label: "Second attack only" },
  { value: "all", label: "Every attack" },
];

export const RULE_TYPES: Record<RuleTypeId, RuleTypeDef> = {
  missedAttacks: {
    id: "missedAttacks",
    label: "Use all attacks",
    blurb: "Flags members who leave attacks unused. Warns near the end, violates once the war is over.",
    params: [
      {
        kind: "number",
        key: "warnHoursLeft",
        label: "Warn when this many hours are left",
        min: 1,
        max: 24,
        help: "While the war is live, members with unused attacks show as “at risk” once the timer drops below this.",
      },
    ],
    defaults: { warnHoursLeft: 12 },
    describe: () => "Use all of your attacks before the war ends",
    evaluate(ctx, rule) {
      const { war } = ctx;
      if (war.state === "preparation") return [];
      const out: Violation[] = [];
      for (const m of war.clan.members) {
        const left = war.attacksPerMember - m.attacks.length;
        if (left <= 0) continue;
        if (war.state === "warEnded") {
          out.push(makeViolation(rule, m, "violated", `Left ${plural(left, "attack")} unused`));
        } else if (ctx.hoursLeft <= num(rule.params, "warnHoursLeft")) {
          out.push(
            makeViolation(rule, m, "atRisk", `${plural(left, "attack")} still unused · ${formatHours(ctx.hoursLeft)} left`)
          );
        }
      }
      return out;
    },
  },

  mirror: {
    id: "mirror",
    label: "Attack your mirror",
    blurb: "Attacks must stay close to the attacker's own map position (both directions).",
    params: [
      { kind: "number", key: "maxRankGap", label: "Max ranks away", min: 0, max: 10, help: "0 = exact mirror only." },
      { kind: "select", key: "appliesTo", label: "Applies to", options: APPLIES_FIRST_ALL },
      {
        kind: "number",
        key: "windowHours",
        label: "Only during the first … hours",
        min: 0,
        max: 24,
        help: "0 = whole war. Needs attack timestamps; attacks without one are skipped.",
      },
    ],
    defaults: { maxRankGap: 2, appliesTo: "first", windowHours: 0 },
    describe: (p) => {
      const gap = num(p, "maxRankGap");
      const win = num(p, "windowHours");
      const who = str(p, "appliesTo") === "all" ? "Every attack" : "Your first attack";
      const where = gap === 0 ? "must hit your exact mirror" : `must hit within ${plural(gap, "rank")} of your own`;
      return `${who} ${where}${win > 0 ? ` (first ${win}h of war)` : ""}`;
    },
    evaluate(ctx, rule) {
      const maxGap = num(rule.params, "maxRankGap");
      const win = num(rule.params, "windowHours");
      const out: Violation[] = [];
      for (const m of ctx.war.clan.members) {
        for (const { attack, index } of pickAttacks(m, str(rule.params, "appliesTo"))) {
          if (win > 0) {
            const h = ctx.hoursIntoWar(attack.observedAt);
            if (h === null || h > win) continue;
          }
          const def = ctx.enemyByTag.get(attack.defenderTag);
          if (!def) continue;
          const gap = Math.abs(def.mapPosition - m.mapPosition);
          if (gap > maxGap) {
            out.push(
              makeViolation(
                rule,
                m,
                "violated",
                `Attack ${index + 1} hit #${def.mapPosition} from rank #${m.mapPosition} — ${plural(gap, "rank")} away (max ${maxGap})`,
                attack
              )
            );
          }
        }
      }
      return out;
    },
  },

  minStars: {
    id: "minStars",
    label: "Minimum stars",
    blurb: "Attacks must earn at least a set number of stars.",
    params: [
      { kind: "number", key: "minStars", label: "Minimum stars", min: 1, max: 3 },
      { kind: "select", key: "appliesTo", label: "Applies to", options: APPLIES_FIRST_SECOND_ALL },
    ],
    defaults: { minStars: 2, appliesTo: "first" },
    describe: (p) => {
      const a = str(p, "appliesTo");
      const who = a === "all" ? "Every attack" : a === "second" ? "Your second attack" : "Your first attack";
      return `${who} must earn at least ${num(p, "minStars")}★`;
    },
    evaluate(ctx, rule) {
      const min = num(rule.params, "minStars");
      const out: Violation[] = [];
      for (const m of ctx.war.clan.members) {
        for (const { attack, index } of pickAttacks(m, str(rule.params, "appliesTo"))) {
          if (attack.stars >= min) continue;
          const def = ctx.enemyByTag.get(attack.defenderTag);
          out.push(
            makeViolation(
              rule,
              m,
              "violated",
              `Attack ${index + 1} on ${def ? `#${def.mapPosition}` : "an enemy base"} earned ${attack.stars}★ (needs ${min}★)`,
              attack
            )
          );
        }
      }
      return out;
    },
  },

  noPunchUp: {
    id: "noPunchUp",
    label: "No attacking above your rank",
    blurb: "Stops members from hitting bases ranked better than their own, optionally only early in the war.",
    params: [
      { kind: "number", key: "maxRanksAbove", label: "Ranks above allowed", min: 0, max: 10, help: "0 = any base above you is off-limits." },
      {
        kind: "number",
        key: "untilHour",
        label: "Only during the first … hours",
        min: 0,
        max: 24,
        help: "0 = whole war. Needs attack timestamps; attacks without one are skipped.",
      },
    ],
    defaults: { maxRanksAbove: 0, untilHour: 12 },
    describe: (p) => {
      const up = num(p, "maxRanksAbove");
      const until = num(p, "untilHour");
      return `Don't attack ${up > 0 ? `more than ${plural(up, "rank")} ` : ""}above your own rank${until > 0 ? ` in the first ${until}h` : ""}`;
    },
    evaluate(ctx, rule) {
      const maxUp = num(rule.params, "maxRanksAbove");
      const until = num(rule.params, "untilHour");
      const out: Violation[] = [];
      for (const m of ctx.war.clan.members) {
        for (const attack of m.attacks) {
          if (until > 0) {
            const h = ctx.hoursIntoWar(attack.observedAt);
            if (h === null || h > until) continue;
          }
          const def = ctx.enemyByTag.get(attack.defenderTag);
          if (!def) continue;
          if (def.mapPosition < m.mapPosition - maxUp) {
            out.push(
              makeViolation(
                rule,
                m,
                "violated",
                `Hit #${def.mapPosition} — ${plural(m.mapPosition - def.mapPosition, "rank")} above their own #${m.mapPosition}`,
                attack
              )
            );
          }
        }
      }
      return out;
    },
  },

  assignedBase: {
    id: "assignedBase",
    label: "Attack assigned base",
    blurb: "Members with an assignment (e.g. from your CWL base assigner) may only hit their assigned base(s).",
    params: [],
    defaults: {},
    describe: () => "Only attack your assigned base(s)",
    evaluate(ctx, rule) {
      const out: Violation[] = [];
      for (const m of ctx.war.clan.members) {
        const assigned = ctx.assignments[m.tag];
        if (!assigned || assigned.length === 0) continue;
        for (const attack of m.attacks) {
          const def = ctx.enemyByTag.get(attack.defenderTag);
          if (!def || assigned.includes(def.mapPosition)) continue;
          out.push(
            makeViolation(
              rule,
              m,
              "violated",
              `Hit #${def.mapPosition} instead of assigned ${assigned.map((n) => `#${n}`).join(", ")}`,
              attack
            )
          );
        }
      }
      return out;
    },
  },
};

export const RULE_TYPE_LIST: RuleTypeDef[] = Object.values(RULE_TYPES);
import type { War } from "../types";
import { RULE_TYPES } from "./definitions";
import { phaseOfWar, rulePhase } from "./phase";
import type { Assignments, EvalContext, Rule, RuleTypeId, Violation } from "./types";

const HOUR_MS = 3_600_000;

/**
 * Runs every enabled, auto-checkable rule that belongs to the war's current phase
 * (preparation-day rules on preparation day, battle-day rules on battle day and after)
 * and returns the combined violations. Pure and framework-free, so it can run in the
 * browser today and on your server (right after you fetch from the CoC API) later.
 */
export function evaluateRules(
  war: War,
  rules: Rule[],
  opts: { now?: Date; assignments?: Assignments } = {}
): Violation[] {
  const now = opts.now ?? new Date();
  const startMs = new Date(war.startTime).getTime();
  const endMs = new Date(war.endTime).getTime();

  const ctx: EvalContext = {
    war,
    now,
    hoursLeft: Math.max(0, (endMs - now.getTime()) / HOUR_MS),
    hoursElapsed: Math.max(0, (Math.min(now.getTime(), endMs) - startMs) / HOUR_MS),
    hoursIntoWar: (iso) => (iso ? (new Date(iso).getTime() - startMs) / HOUR_MS : null),
    enemyByTag: new Map(war.opponent.members.map((m) => [m.tag, m])),
    assignments: opts.assignments ?? {},
  };

  const phase = phaseOfWar(war.state);

  const out: Violation[] = [];
  for (const rule of rules) {
    if (!rule.enabled || rule.type === "manual") continue;
    if (rulePhase(rule) !== phase) continue; // not this phase's rule — don't check it yet (or any more)
    const def = RULE_TYPES[rule.type as RuleTypeId];
    if (!def) continue; // unknown/removed rule type saved earlier — ignore
    out.push(...def.evaluate(ctx, rule));
  }

  // Broken rules first, then major before minor, then by map position.
  return out.sort((a, b) => {
    if (a.status !== b.status) return a.status === "violated" ? -1 : 1;
    if (a.severity !== b.severity) return a.severity === "major" ? -1 : 1;
    return a.memberPosition - b.memberPosition;
  });
}
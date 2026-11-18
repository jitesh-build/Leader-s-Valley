import type { War } from "../types";
import { RULE_TYPES } from "./definitions";
import type { Assignments, EvalContext, Rule, RuleTypeId, Violation } from "./types";

const HOUR_MS = 3_600_000;

/**
 * Runs every enabled, auto-checkable rule against the war and returns the
 * combined violations. Pure and framework-free, so it can run in the browser
 * today and on your server (right after you fetch from the CoC API) later.
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
    hoursIntoWar: (iso) => (iso ? (new Date(iso).getTime() - startMs) / HOUR_MS : null),
    enemyByTag: new Map(war.opponent.members.map((m) => [m.tag, m])),
    assignments: opts.assignments ?? {},
  };

  const out: Violation[] = [];
  for (const rule of rules) {
    if (!rule.enabled || rule.type === "manual") continue;
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
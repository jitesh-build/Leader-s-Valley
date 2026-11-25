import type { WarState } from "../types";
import type { Rule, RulePhase } from "./types";

/** Preparation day -> "preparation". Battle day and the finished war -> "battle". */
export const phaseOfWar = (state: WarState): RulePhase => (state === "preparation" ? "preparation" : "battle");

/** Rules saved before phases existed have no `phase`; they were all battle-day rules. */
export const rulePhase = (rule: Rule): RulePhase => rule.phase ?? "battle";

export const PHASE_LABEL: Record<RulePhase, string> = {
  preparation: "Preparation day rules",
  battle: "Battle day rules",
};
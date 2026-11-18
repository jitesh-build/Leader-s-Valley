import type { War, WarMember } from "../types";

export type Severity = "minor" | "major";
export type RuleTypeId = "missedAttacks" | "mirror" | "minStars" | "noPunchUp" | "assignedBase";
export type RuleParams = Record<string, number | string>;

export interface Rule {
  id: string;
  /** "manual" rules are free text that can't be auto-checked. */
  type: RuleTypeId | "manual";
  title: string;
  params: RuleParams;
  severity: Severity;
  enabled: boolean;
  /** Extra detail, used by manual rules. */
  note?: string;
}

/** violated = already broken · atRisk = will be broken if nothing changes (e.g. unused attacks, war still live). */
export type ViolationStatus = "violated" | "atRisk";

export interface Violation {
  id: string;
  ruleId: string;
  ruleTitle: string;
  severity: Severity;
  memberTag: string;
  memberName: string;
  memberPosition: number;
  status: ViolationStatus;
  message: string;
  attackOrder?: number;
}

/** Our member's tag -> enemy map positions they were told to attack (e.g. from your CWL base assigner). */
export type Assignments = Record<string, number[]>;

export interface EvalContext {
  war: War;
  now: Date;
  /** Hours between war start and the given timestamp, or null if there is no timestamp. */
  hoursIntoWar: (iso?: string) => number | null;
  hoursLeft: number;
  enemyByTag: ReadonlyMap<string, WarMember>;
  assignments: Assignments;
}

export interface NumberParam {
  kind: "number";
  key: string;
  label: string;
  min: number;
  max: number;
  help?: string;
}

export interface SelectParam {
  kind: "select";
  key: string;
  label: string;
  options: { value: string; label: string }[];
  help?: string;
}

export type ParamDef = NumberParam | SelectParam;
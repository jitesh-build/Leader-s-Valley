import type { Member, Role } from "../Members/types";

/** Thresholds leaders can tune. Promotion needs ALL checks to pass; review is flagged when ANY trigger hits. */
export interface RoleCriteria {
  // --- promotion ---
  minParticipation: number; // % of eligible wars played
  minAttackUse: number; // % of war attacks actually used
  maxBreaks: number; // max rule breaks (war + CWL + capital)
  minDonations: number; // donated this season
  minRatio: number; // donated ÷ received
  minClanGames: number; // points in the latest clan games
  minTenureElder: number; // days in clan before becoming Elder
  minTenureCo: number; // days in clan before becoming Co-leader
  // --- demotion review (Elders & Co-leaders only) ---
  reviewBreaks: number; // flagged at this many rule breaks or more
  reviewParticipation: number; // flagged below this % war participation
}

export interface CriterionResult {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
}

export interface PromotionSuggestion {
  member: Member;
  to: Role;
  results: CriterionResult[];
  failing: CriterionResult[];
  /** Passes every criterion. */
  ready: boolean;
}

export interface ReviewSuggestion {
  member: Member;
  to: Role;
  reasons: string[];
}

/** A role change a leader still has to make in-game (the official API is read-only). */
export interface PlannedChange {
  id: string;
  tag: string;
  name: string;
  from: Role;
  to: Role;
  reason: string;
  createdAt: string;
  done: boolean;
}
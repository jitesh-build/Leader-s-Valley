export type Role = "leader" | "coLeader" | "admin" | "member";

/**
 * A clan member as the Roles page sees it. Built from the live game data (see hooks/useRoleMembers.ts).
 * `null` means "the game doesn't tell us" — such checks are skipped, never guessed.
 */
export interface RoleMember {
  tag: string;
  name: string;
  role: Role;
  townHallLevel: number;
  /** Donations this season. */
  donations: number;
  donationsReceived: number;
  /** Attacks in the current / just-ended war. null = not in that war. */
  war: { attacksUsed: number; attacksAvailable: number } | null;
  /** Attacks in the latest capital raid weekend. null = not listed for it. */
  raid: { attacksUsed: number; attackLimit: number } | null;
  /** Rules broken in the current war (from the rules on the Clan War page). null = no war to check. */
  ruleBreaks: number | null;

  // --- Not provided by the official game API. Kept (always null for now) so history can fill them in later. ---
  joinedAt: string | null;
  warsParticipated: number | null;
  warsEligible: number | null;
  clanGamesPoints: number | null;
}

/** Thresholds leaders can tune. Promotion needs ALL known checks to pass; review is flagged when ANY trigger hits. */
export interface RoleCriteria {
  // --- promotion ---
  minParticipation: number; // % of eligible wars played (needs war history)
  minAttackUse: number; // % of attacks used in the current war
  minRaidUse: number; // % of capital raid attacks used in the latest raid weekend
  maxBreaks: number; // max rules broken in the current war
  minDonations: number; // donated this season
  minRatio: number; // donated ÷ received
  minClanGames: number; // points in the latest clan games (needs history)
  minTenureElder: number; // days in clan before becoming Elder (needs history)
  minTenureCo: number; // days in clan before becoming Co-leader (needs history)
  // --- demotion review (Elders & Co-leaders only) ---
  reviewBreaks: number; // flagged at this many broken rules or more
  reviewParticipation: number; // flagged below this % war participation (needs war history)
  reviewAttackUse: number; // flagged below this % of attacks used in the current war
  reviewDonations: number; // flagged when donated fewer than this this season
}

/** unknown = the game gives no data for this check, so it is skipped. */
export type CriterionStatus = "pass" | "fail" | "unknown";

export interface CriterionResult {
  id: string;
  label: string;
  status: CriterionStatus;
  detail: string;
}

export interface PromotionSuggestion {
  member: RoleMember;
  to: Role;
  results: CriterionResult[];
  failing: CriterionResult[];
  /** Checks that had no data and were skipped. */
  unknown: CriterionResult[];
  /** Every check that HAS data passes (and at least MIN_KNOWN_CHECKS have data). */
  ready: boolean;
}

export interface ReviewSuggestion {
  member: RoleMember;
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
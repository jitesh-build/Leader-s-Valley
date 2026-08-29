export const WAR_MODES = ["5v5", "15v15", "30v30", "custom"] as const;

export type WarMode = (typeof WAR_MODES)[number];

export const WAR_MODE_SIZES: Record<Exclude<WarMode, "custom">, number> = {
  "5v5": 5,
  "15v15": 15,
  "30v30": 30,
};

export function isWarMode(value: unknown): value is WarMode {
  return typeof value === "string" && (WAR_MODES as readonly string[]).includes(value);
}

export type StarCount = 1 | 2 | 3;

export interface War {
  _id: string;
  name: string;
  mode: WarMode;
  size: number;
  leagueTier: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarSummary {
  size: number;
  slotCount: number;
  teamBasesTotal: number;
  teamBasesAssigned: number;
  teamBasesAvailable: number;
  enemyBasesTotal: number;
  enemyBasesAssigned: number;
  enemyBasesAvailable: number;
}

export interface Slot {
  _id: string;
  warId: string;
  index: number;
  teamBaseNumber: number | null;
  /** Single locked-in enemy target. Always null while isMultiSelect is true. */
  enemyBaseNumber: number | null;
  /** Candidate enemy bases. Only meaningful while isMultiSelect is true. */
  enemyBaseNumbers: number[];
  isMultiSelect: boolean;
  starsNeeded: StarCount;
  createdAt: string;
  updatedAt: string;
}

export interface EnemyScout {
  _id: string;
  warId: string;
  baseNumber: number;
  expectedStars: StarCount;
  createdAt: string;
  updatedAt: string;
}
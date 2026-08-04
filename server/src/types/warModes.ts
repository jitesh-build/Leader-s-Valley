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

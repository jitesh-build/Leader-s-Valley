import type { LucideIcon } from "lucide-react";

export type Tone = "gold" | "red" | "purple" | "blue";

/** live = a war is being fought · prep = preparation day · count = a plain number (e.g. CWL round) */
export type BadgeVariant = "live" | "prep" | "count";

export interface NavBadge {
  text: string;
  variant: BadgeVariant;
  /** Tooltip text. */
  title?: string;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Route path. Items without a path have no page yet. */
  path?: string;
}

export interface Stat {
  label: string;
  value: string;
  suffix?: string;
  sub: string;
  subTone?: "green" | "muted";
  trend?: "up";
  icon: LucideIcon;
  tone: Tone;
}

export interface HealthMetric {
  label: string;
  /** 0-100, or null when the game gives no data for it right now. */
  value: number | null;
  /** Explains the number, shown as a tooltip. */
  detail?: string;
}
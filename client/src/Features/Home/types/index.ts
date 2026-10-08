import type { LucideIcon } from "lucide-react";

export type Tone = "gold" | "red" | "purple" | "blue";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  badge?: { text: string; variant: "live" | "count" };
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
  value: number;
}
// import {
//   Home, Swords, ShieldCheck, Landmark, UserCheck, UserPlus,
// } from "lucide-react";
// import type { HealthMetric, NavItem, Stat } from "../types";

// export const navItems: NavItem[] = [
//   { label: "Overview", icon: Home, path: "/" },
//   { label: "Clan Wars", icon: Swords, path: "/clan-wars", badge: { text: "LIVE", variant: "live" } },
//   { label: "CWL", icon: ShieldCheck, path: "/cwl", badge: { text: "3", variant: "count" } },
//   { label: "Capital Hall", icon: Landmark, path: "/capital-hall" },
//   { label: "Roles", icon: UserCheck, path: "/roles" },
//   { label: "Members", icon: UserPlus, path: "/members" },
// ];

// export const stats: Stat[] = [
//   { label: "Clan members", value: "47", suffix: "/ 50", sub: "+2 this week", subTone: "green", icon: UserPlus, tone: "gold" },
//   { label: "War win rate", value: "78%", sub: "12 wins · 3 losses", icon: Swords, tone: "red" },
//   { label: "Capital Hall", value: "Level 10", sub: "84% upgraded", subTone: "green", icon: Landmark, tone: "purple" },
//   { label: "CWL league", value: "Crystal II", sub: "2 from last season", subTone: "green", trend: "up", icon: ShieldCheck, tone: "blue" },
// ];

// export const healthMetrics: HealthMetric[] = [
//   { label: "Activity", value: 92 },
//   { label: "Donations", value: 84 },
//   { label: "War attacks", value: 81 },
// ];

import { Home, Swords, ShieldCheck, Landmark, UserCheck, UserPlus } from "lucide-react";
import type { NavItem } from "../types";

/** Sidebar links. The little LIVE / round badges are live data now — see buildNavBadges() in buildHome.ts. */
export const navItems: NavItem[] = [
  { label: "Overview", icon: Home, path: "/" },
  { label: "Clan Wars", icon: Swords, path: "/clan-wars" },
  { label: "CWL", icon: ShieldCheck, path: "/cwl" },
  { label: "Capital Hall", icon: Landmark, path: "/capital-hall" },
  { label: "Roles", icon: UserCheck, path: "/roles" },
  { label: "Members", icon: UserPlus, path: "/members" },
];
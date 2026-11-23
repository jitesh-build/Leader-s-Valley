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
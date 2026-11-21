import { useState, type ReactNode } from "react";
import { Check, Crown, Minus, Shield, Star, Users, X, type LucideIcon } from "lucide-react";
import { thImage } from "../../ClanWars/assets";
import type { CriterionStatus, Role } from "../types";

export interface RoleMeta {
  title: string;
  plural: string;
  hint: string;
  icon: LucideIcon;
  /** Classes for the small role chip. */
  chip: string;
  /** Text colour for headings of this role. */
  text: string;
}

export const ROLE_META: Record<Role, RoleMeta> = {
  leader: { title: "Leader", plural: "Leader", hint: "Runs the clan", icon: Crown, chip: "bg-gold/15 text-gold ring-gold/30", text: "text-gold" },
  coLeader: { title: "Co-leader", plural: "Co-leaders", hint: "Right hand of the leader", icon: Shield, chip: "bg-purple-500/15 text-purple-300 ring-purple-500/30", text: "text-purple-300" },
  admin: { title: "Elder", plural: "Elders", hint: "Trusted members", icon: Star, chip: "bg-sky-500/15 text-sky-300 ring-sky-500/30", text: "text-sky-300" },
  member: { title: "Member", plural: "Members", hint: "The rest of the clan", icon: Users, chip: "bg-white/5 text-muted2 ring-white/10", text: "text-muted2" },
};

export const ROLE_ORDER: Role[] = ["leader", "coLeader", "admin", "member"];

export const roleTitle = (role: Role): string => ROLE_META[role].title;

/** Small coloured role label, e.g. "ELDER". */
export function RoleChip({ role }: { role: Role }) {
  const m = ROLE_META[role];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider ring-1 ${m.chip}`}>
      <Icon size={10} />
      {m.title.toUpperCase()}
    </span>
  );
}

/** Town hall picture; falls back to a gold number tile if the image file isn't there. */
export function TownHall({ level, size = 40 }: { level: number; size?: number }) {
  const [failedLevel, setFailedLevel] = useState<number | null>(null);
  if (failedLevel === level) {
    return (
      <span
        title={`Town Hall ${level}`}
        className="flex shrink-0 items-center justify-center rounded-lg bg-gold/10 font-display font-bold text-gold"
        style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.36)) }}
      >
        {level}
      </span>
    );
  }
  return (
    <img
      src={thImage(level)}
      alt={`Town Hall ${level}`}
      title={`Town Hall ${level}`}
      draggable={false}
      onError={() => setFailedLevel(level)}
      className="shrink-0 object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
      style={{ width: size, height: size }}
    />
  );
}

export function CheckIcon({ status, size = 13 }: { status: CriterionStatus; size?: number }) {
  if (status === "pass") return <Check size={size} strokeWidth={3} className="text-green-400" />;
  if (status === "fail") return <X size={size} strokeWidth={3} className="text-red-400" />;
  return <Minus size={size} strokeWidth={3} className="text-muted" />;
}

type PillTone = "green" | "amber" | "gold" | "red" | "muted";
const PILL: Record<PillTone, string> = {
  green: "bg-green-500/15 text-green-400 ring-green-500/30",
  amber: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  gold: "bg-gold/15 text-gold ring-gold/30",
  red: "bg-red-500/15 text-red-400 ring-red-500/30",
  muted: "bg-white/5 text-muted2 ring-white/10",
};

export function Pill({ tone, icon, children }: { tone: PillTone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ring-1 ${PILL[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

/** A row of little bars, one per check: green = pass, red = fail, grey = no data. */
export function CheckStrip({ statuses }: { statuses: CriterionStatus[] }) {
  const colour: Record<CriterionStatus, string> = { pass: "bg-green-500", fail: "bg-red-500", unknown: "bg-white/15" };
  return (
    <div className="flex gap-1" aria-hidden>
      {statuses.map((s, i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${colour[s]}`} />
      ))}
    </div>
  );
}
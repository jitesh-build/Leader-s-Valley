import type { ComponentProps } from "react";
import { Star } from "lucide-react";
import { RoleChip, TownHall } from "../../Roles/components/ui";
import type { CwlRound, Member } from "../types";

export function MemberCell({ member }: { member: Member }) {
  return (
    <div className="flex min-w-[210px] items-center gap-3">
      <TownHall level={member.townHallLevel} size={38} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">{member.name}</span>
          {member.role !== "member" && <RoleChip role={member.role} />}
        </div>
        <div className="text-[11px] text-muted">{member.tag}</div>
      </div>
    </div>
  );
}

/** Small role label (Leader / Co-leader / Elder). Same look as RoleChip; takes whatever role type RoleChip takes. */
export function RoleBadge({ role }: { role: ComponentProps<typeof RoleChip>["role"] }) {
  return <RoleChip role={role} />;
}

export function Dash() {
  return <span className="text-xs text-muted/70">—</span>;
}

/** "9/10" with a note underneath when attacks are unused: "missed" once it's over, "left" while it's still running. */
export function Frac({ used, total, final }: { used: number; total: number; final: boolean }) {
  const left = Math.max(0, total - used);
  return (
    <div>
      <span className="font-semibold text-white">{used}</span>
      <span className="text-muted">/{total}</span>
      {left > 0 && <div className={`text-[10px] ${final ? "text-red-400" : "text-amber-400"}`}>{left} {final ? "missed" : "left"}</div>}
    </div>
  );
}

export function StarsInline({ count, max = 3, size = 11 }: { count: number; max?: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${count} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} size={size} strokeWidth={1.6} className={i < count ? "fill-gold text-gold" : "text-white/20"} />
      ))}
    </span>
  );
}

const STAR_CELL = ["bg-red-500/20 text-red-300", "bg-amber-500/20 text-amber-300", "bg-gold/20 text-gold", "bg-green-500/20 text-green-300"] as const;

/** One CWL round as a small square: stars earned, missed, waiting, or not played. `round` undefined = the round hasn't started. */
export function RoundCell({ round, index }: { round: CwlRound | undefined; index: number }) {
  const base = "flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold";
  const title = (text: string) => `Round ${index + 1}: ${text}`;
  if (!round) return <span title={title("not started")} className={`${base} bg-white/[0.03] text-white/20`}>·</span>;
  if (!round.played) return <span title={title("not in the lineup")} className={`${base} bg-white/5 text-muted`}>–</span>;
  if (round.attacked) {
    const s = Math.min(3, Math.max(0, round.stars ?? 0));
    return <span title={title(`${s} star${s === 1 ? "" : "s"}, ${round.destruction ?? 0}%`)} className={`${base} ${STAR_CELL[s]}`}>{s}</span>;
  }
  return round.ended ? (
    <span title={title("attack missed")} className={`${base} bg-red-500/15 text-red-400 ring-1 ring-red-500/40`}>✕</span>
  ) : (
    <span title={title("attack still to come")} className={`${base} animate-pulse bg-amber-500/15 text-amber-300`}>…</span>
  );
}

/** The 7 rounds in a row. */
export function RoundStrip({ rounds, total }: { rounds: CwlRound[]; total: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label="CWL rounds">
      {Array.from({ length: total }, (_, i) => (
        <RoundCell key={i} round={rounds.find((r) => r.round === i + 1)} index={i} />
      ))}
    </div>
  );
}
import { AlertTriangle } from "lucide-react";
import { formatDate } from "../format";
import type { Member, Role, RuleBreak } from "../types";

const ROLE_LABEL: Record<Role, string> = { leader: "Leader", coLeader: "Co-leader", admin: "Elder", member: "Member" };
const ROLE_STYLE: Record<Role, string> = {
  leader: "bg-gold/15 text-gold ring-gold/30",
  coLeader: "bg-gold/10 text-gold-dim ring-gold/20",
  admin: "bg-blue-500/10 text-blue-400 ring-blue-500/30",
  member: "bg-white/5 text-muted2 ring-white/10",
};

export const roleLabel = (role: Role): string => ROLE_LABEL[role];

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${ROLE_STYLE[role]}`}>
      {ROLE_LABEL[role]}
    </span>
  );
}

export function MemberCell({ member }: { member: Member }) {
  return (
    <div className="flex min-w-[200px] items-center gap-3">
      <span
        title={`Town Hall ${member.townHallLevel}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 font-display text-base font-bold text-gold"
      >
        {member.townHallLevel}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">{member.name}</span>
          <RoleBadge role={member.role} />
        </div>
        <div className="text-[11px] text-muted">{member.tag}</div>
      </div>
    </div>
  );
}

export function BreakBadge({ count }: { count: number }) {
  if (count === 0) return <span className="text-xs text-muted/70">—</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-400 ring-1 ring-red-500/30">
      <AlertTriangle size={11} />
      {count}
    </span>
  );
}

/** "9/10" with a red "1 missed" underneath when not everything was used. */
export function Frac({ used, total }: { used: number; total: number }) {
  const missed = Math.max(0, total - used);
  return (
    <div>
      <span className="font-semibold text-white">{used}</span>
      <span className="text-muted">/{total}</span>
      {missed > 0 && <div className="text-[10px] text-red-400">{missed} missed</div>}
    </div>
  );
}

export function MiniBars({ values, max, title }: { values: (number | null)[]; max: number; title?: string }) {
  return (
    <div className="flex h-6 items-end justify-end gap-0.5" title={title}>
      {values.map((v, i) =>
        v === null ? (
          <span key={i} className="h-1 w-1.5 rounded-sm bg-white/10" />
        ) : (
          <span key={i} className="w-1.5 rounded-sm bg-gold/80" style={{ height: `${Math.max(12, (v / max) * 100)}%` }} />
        )
      )}
    </div>
  );
}

export function RuleBreakList({ breaks, emptyText = "No rule breaks on record." }: { breaks: RuleBreak[]; emptyText?: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">RULE BREAKS</div>
      {breaks.length === 0 ? (
        <p className="mt-2 text-xs text-gold">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {breaks.map((b) => (
            <li key={b.id} className="text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${
                    b.severity === "major" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {b.severity === "major" ? "MAJOR" : "MINOR"}
                </span>
                <span className="font-semibold text-white">{b.rule}</span>
                <span className="text-muted">{formatDate(b.date)}</span>
              </div>
              <div className="mt-0.5 text-muted2">{b.detail}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
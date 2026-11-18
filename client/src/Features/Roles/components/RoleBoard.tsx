import { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { Member, Role } from "../../Members/types";

interface Props {
  members: Member[];
  readyTags: Set<string>;
  reviewTags: Set<string>;
}

const COLUMNS: { role: Role; title: string; hint: string }[] = [
  { role: "leader", title: "Leader", hint: "Runs the clan" },
  { role: "coLeader", title: "Co-leaders", hint: "Right hand" },
  { role: "admin", title: "Elders", hint: "Trusted members" },
  { role: "member", title: "Members", hint: "The rest of the clan" },
];

export default function RoleBoard({ members, readyTags, reviewTags }: Props) {
  const byRole = useMemo(() => {
    const map = new Map<Role, Member[]>();
    for (const m of members) {
      const list = map.get(m.role);
      if (list) list.push(m);
      else map.set(m.role, [m]);
    }
    for (const list of map.values()) list.sort((a, b) => b.townHallLevel - a.townHallLevel || a.name.localeCompare(b.name));
    return map;
  }, [members]);

  return (
    <section className="rounded-xl border border-line bg-card p-6">
      <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">CHAIN OF COMMAND</div>
      <h2 className="mt-2 font-display text-[26px] font-bold text-white">Who holds what</h2>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map(({ role, title, hint }) => {
          const list = byRole.get(role) ?? [];
          return (
            <div key={role} className="rounded-xl bg-panel p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg font-bold text-white">{title}</span>
                <span className={`font-display text-xl font-bold ${role === "leader" || role === "coLeader" ? "text-gold" : "text-muted2"}`}>{list.length}</span>
              </div>
              <div className="text-[11px] text-muted">{hint}</div>

              <ul className="mt-3 max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
                {list.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-line px-3 py-3 text-center text-xs text-muted">Nobody yet</li>
                ) : (
                  list.map((m) => (
                    <li key={m.tag} className="flex items-center gap-2.5 rounded-lg border border-line bg-card px-2.5 py-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gold/10 font-display text-xs font-bold text-gold" title={`Town Hall ${m.townHallLevel}`}>
                        {m.townHallLevel}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-white">{m.name}</span>
                      {readyTags.has(m.tag) && <TrendingUp size={14} className="shrink-0 text-green-400" aria-label="Ready for promotion" />}
                      {reviewTags.has(m.tag) && <TrendingDown size={14} className="shrink-0 text-amber-400" aria-label="Needs review" />}
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><TrendingUp size={12} className="text-green-400" /> ready for promotion</span>
        <span className="flex items-center gap-1.5"><TrendingDown size={12} className="text-amber-400" /> needs a review</span>
      </div>
    </section>
  );
}
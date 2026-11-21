import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Role, RoleMember } from "../types";
import MemberCard from "./MemberCard";
import { ROLE_META, ROLE_ORDER } from "./ui";

interface Props {
  members: RoleMember[];
  readyTags: Set<string>;
  reviewTags: Set<string>;
  plannedTags: Set<string>;
  onOpen: (tag: string) => void;
}

type SortKey = "th" | "donations" | "name";
type Filter = "all" | "ready" | "review" | "planned";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "th", label: "Town hall" },
  { id: "donations", label: "Donations" },
  { id: "name", label: "Name" },
];

const sorters: Record<SortKey, (a: RoleMember, b: RoleMember) => number> = {
  th: (a, b) => b.townHallLevel - a.townHallLevel || b.donations - a.donations || a.name.localeCompare(b.name),
  donations: (a, b) => b.donations - a.donations || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
};

const pill = (active: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
    active ? "border-gold/60 bg-gold/10 text-gold" : "border-line text-muted2 hover:border-gold/30 hover:text-white"
  }`;

export default function ChainOfCommand({ members, readyTags, reviewTags, plannedTags, onOpen }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("th");
  const [filter, setFilter] = useState<Filter>("all");

  const maxDonations = useMemo(() => members.reduce((m, x) => Math.max(m, x.donations), 0), [members]);

  const byRole = useMemo(() => {
    const q = query.trim().toLowerCase();
    const keep = (m: RoleMember): boolean => {
      if (q && !m.name.toLowerCase().includes(q) && !m.tag.toLowerCase().includes(q)) return false;
      if (filter === "ready") return readyTags.has(m.tag);
      if (filter === "review") return reviewTags.has(m.tag);
      if (filter === "planned") return plannedTags.has(m.tag);
      return true;
    };
    const map = new Map<Role, RoleMember[]>();
    for (const m of members) {
      if (!keep(m)) continue;
      const list = map.get(m.role);
      if (list) list.push(m);
      else map.set(m.role, [m]);
    }
    for (const list of map.values()) list.sort(sorters[sort]);
    return map;
  }, [members, query, filter, sort, readyTags, reviewTags, plannedTags]);

  const shown = [...byRole.values()].reduce((n, l) => n + l.length, 0);
  const filtering = query.trim() !== "" || filter !== "all";

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: members.length },
    { id: "ready", label: "Ready", count: readyTags.size },
    { id: "review", label: "Review", count: reviewTags.size },
    { id: "planned", label: "Planned", count: plannedTags.size },
  ];

  return (
    <section aria-label="Chain of command" className="rounded-xl border border-line bg-card p-6">
      <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">CHAIN OF COMMAND</div>
      <h2 className="mt-2 font-display text-[26px] font-bold text-white">Who holds what</h2>

      {/* search / filter / sort */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="flex h-[38px] min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-line bg-panel px-3 text-muted focus-within:border-gold/50">
          <Search size={14} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or tag"
            aria-label="Search members"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
          />
        </label>
        <div role="group" aria-label="Sort by" className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold tracking-[0.14em] text-muted">SORT</span>
          {SORTS.map((s) => (
            <button key={s.id} type="button" aria-pressed={sort === s.id} onClick={() => setSort(s.id)} className={pill(sort === s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div role="group" aria-label="Show" className="mt-3 flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={pill(filter === f.id)}>
            {f.label} <span className="ml-1 opacity-70">{f.count}</span>
          </button>
        ))}
      </div>

      {/* tiers */}
      <div className="mt-6 space-y-7">
        {shown === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">No members match.</p>
        ) : (
          ROLE_ORDER.map((role) => {
            const list = byRole.get(role) ?? [];
            if (list.length === 0 && filtering) return null;
            const meta = ROLE_META[role];
            const Icon = meta.icon;
            return (
              <div key={role}>
                <div className="mb-3 flex items-center gap-2.5">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 ${meta.text}`}>
                    <Icon size={15} strokeWidth={2} />
                  </span>
                  <h3 className={`font-display text-xl font-bold ${meta.text}`}>{meta.plural}</h3>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-muted2">{list.length}</span>
                  <span className="text-[11px] text-muted">{meta.hint}</span>
                </div>
                {list.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line px-4 py-4 text-center text-xs text-muted">Nobody yet</p>
                ) : (
                  <ul className={`grid gap-3 ${role === "leader" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                    {list.map((m) => (
                      <li key={m.tag}>
                        <MemberCard
                          member={m}
                          maxDonations={maxDonations}
                          ready={readyTags.has(m.tag)}
                          review={reviewTags.has(m.tag)}
                          planned={plannedTags.has(m.tag)}
                          onOpen={() => onOpen(m.tag)}
                          hero={role === "leader"}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
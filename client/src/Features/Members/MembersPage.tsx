import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, Info, Landmark, Layers, Search, ShieldAlert, ShieldCheck, Swords, type LucideIcon } from "lucide-react";
import StatCard from "../Home/components/Statcard";
import { useNow } from "../ClanWars/hooks/useNow";
import { useRules } from "../ClanWars/hooks/useRules";
import { useWarData } from "../ClanWars/hooks/useWarData";
import { evaluateRules } from "../ClanWars/rules/engine";
import CapitalTab from "./components/CapitalTab";
import ClanWarTab, { type LiveWar } from "./components/ClanwarTab";
import CwlTab from "./components/Cwltab";
import OtherTab from "./components/Othertab";
import { roleLabel } from "./components/ui";
import { useMemberNotes } from "./hooks/useMemberNotes";
import { useMembers } from "./hooks/useMembers";
import { buildSummary } from "./summary";
import type { Member, Role, TabId } from "./types";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "war", label: "Clan War", icon: Swords },
  { id: "cwl", label: "CWL", icon: ShieldCheck },
  { id: "capital", label: "Capital District", icon: Landmark },
  { id: "other", label: "Other", icon: Layers },
];

const ROLES: Role[] = ["leader", "coLeader", "admin", "member"];

const parseTab = (v: string | null): TabId => (TABS.some((t) => t.id === v) ? (v as TabId) : "war");

export default function MembersPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseTab(params.get("tab"));

  const { members, isSample } = useMembers();
  const { notes, setNote, toggleWatch } = useMemberNotes();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  // Live rule check of the current war, reusing the Clan War page's rules + engine.
  const { war, assignments } = useWarData();
  const { rules } = useRules();
  const now = useNow(60_000);
  const liveByTag = useMemo(() => {
    const map = new Map<string, LiveWar>();
    for (const v of evaluateRules(war, rules, { now, assignments })) {
      const entry = map.get(v.memberTag) ?? { broken: 0, atRisk: 0 };
      if (v.status === "violated") entry.broken++;
      else entry.atRisk++;
      map.set(v.memberTag, entry);
    }
    return map;
  }, [war, rules, now, assignments]);

  const watchCount = members.filter((m) => notes[m.tag]?.watch).length;

  function isFlagged(m: Member): boolean {
    switch (tab) {
      case "war":
        return m.war.ruleBreaks.length > 0 || liveByTag.has(m.tag);
      case "cwl":
        return m.cwl.ruleBreaks.length > 0;
      case "capital":
        return m.capital.ruleBreaks.length > 0;
      case "other":
        return Boolean(notes[m.tag]?.watch);
    }
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) =>
        (role === "all" || m.role === role) &&
        (!q || m.name.toLowerCase().includes(q) || m.tag.toLowerCase().includes(q)) &&
        (!flaggedOnly || isFlagged(m))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, query, role, flaggedOnly, tab, liveByTag, notes]);

  const summary = useMemo(() => buildSummary(tab, members, watchCount), [tab, members, watchCount]);

  const season = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const caption: Record<TabId, string> = {
    war: "Clan war record across tracked wars. Tap a row to see rule breaks.",
    cwl: `${season} league · latest Clan War League season. Bonus holders are chosen by leaders.`,
    capital: "Latest raid weekend and lifetime capital gold contributed. Tap a row for the district breakdown.",
    other: "Clan games, donations and leader notes. Tap a row to add a note or flag.",
  };

  return (
    <div className="px-12 pb-10 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.16em] text-gold-dim">ROSTER</div>
          <h1 className="mt-5 font-display text-[40px] font-bold leading-none text-white">Members</h1>
          <p className="mt-3 text-sm text-muted">Everything about each member, from wars to capital raids.</p>
        </div>
        {isSample && (
          <div className="mb-1 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-xs text-muted2">
            <Info size={14} className="text-gold" />
            Sample data — connect the Clash of Clans API to go live
          </div>
        )}
      </div>

      <div role="tablist" aria-label="Member data" className="mt-9 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setParams({ tab: id }, { replace: true });
                setFlaggedOnly(false);
              }}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition ${
                active ? "border-gold text-gold" : "border-transparent text-muted2 hover:text-white"
              }`}
            >
              <Icon size={16} strokeWidth={1.6} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="flex h-[42px] min-w-[240px] flex-1 items-center gap-3 rounded-lg border border-line bg-card px-4 text-muted focus-within:border-gold/50 sm:max-w-[360px]">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or tag…"
            aria-label="Search members"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
          />
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role | "all")}
          aria-label="Filter by role"
          className="h-[42px] rounded-lg border border-line bg-card px-3 text-sm text-white focus:border-gold/50 focus:outline-none"
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-pressed={flaggedOnly}
          onClick={() => setFlaggedOnly((v) => !v)}
          className={`flex h-[42px] items-center gap-2 rounded-lg border px-4 text-sm font-medium transition ${
            flaggedOnly ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-line bg-card text-muted2 hover:text-white"
          }`}
        >
          {tab === "other" ? <Eye size={15} /> : <ShieldAlert size={15} />}
          {tab === "other" ? "Watch list only" : "Rule breakers only"}
        </button>
        <span className="ml-auto text-xs text-muted">
          Showing {rows.length} of {members.length}
        </span>
      </div>

      <p className="mb-3 mt-5 text-xs text-muted">{caption[tab]}</p>

      {tab === "war" && <ClanWarTab rows={rows} liveByTag={liveByTag} />}
      {tab === "cwl" && <CwlTab rows={rows} />}
      {tab === "capital" && <CapitalTab rows={rows} />}
      {tab === "other" && <OtherTab rows={rows} notes={notes} onNote={setNote} onToggleWatch={toggleWatch} />}
    </div>
  );
}
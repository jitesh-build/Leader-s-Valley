import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, Landmark, Layers, RefreshCw, Search, ShieldAlert, ShieldCheck, Swords, type LucideIcon } from "lucide-react";
import { useClanData } from "../../lib/ClanDataProvider";
import ClanTagForm from "../ClanWars/components/ClanTagForm";
import { useLiveWar } from "../ClanWars/hooks/useLiveWar";
import { useNow } from "../ClanWars/hooks/useNow";
import { useRules } from "../ClanWars/hooks/useRules";
import { evaluateRules } from "../ClanWars/rules/engine";
import type { Violation } from "../ClanWars/rules/types";
import { formatRemaining } from "../Home/data/buildHome";
import StatCard from "../Home/components/Statcard";
import { ROLE_META, ROLE_ORDER } from "../Roles/components/ui";
import CapitalTab from "./components/CapitalTab";
import ClanWarTab, { type LiveWar } from "./components/ClanwarTab";
import CwlTab from "./components/Cwltab";
import MemberDetail from "./components/MemberDetail";
import OtherTab from "./components/Othertab";
import { useMemberNotes } from "./hooks/useMemberNotes";
import { useMembers } from "./hooks/useMembers";
import { buildSummary } from "./summary";
import type { Member, Role, TabId } from "./types";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "war", label: "Clan War", icon: Swords },
  { id: "cwl", label: "CWL", icon: ShieldCheck },
  { id: "capital", label: "Capital District", icon: Landmark },
  { id: "other", label: "Donations", icon: Layers },
];

const parseTab = (v: string | null): TabId => (TABS.some((t) => t.id === v) ? (v as TabId) : "war");

const WAR_LABEL: Record<string, string> = { preparation: "Preparation day", inWar: "Battle day", warEnded: "War ended" };

function Skeleton() {
  const bar = "animate-pulse rounded-xl bg-white/5";
  return (
    <div aria-hidden className="mt-6 space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${bar} h-[110px]`} />
        ))}
      </div>
      <div className={`${bar} h-[420px]`} />
    </div>
  );
}

export default function MembersPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseTab(params.get("tab"));

  const { setClanTag } = useClanData();
  const { clanTag, data, loading, refreshing, error, updatedAt, refresh } = useMembers();
  const { notes, setNote, toggleWatch, toggleBonus } = useMemberNotes();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Live rule check of the current war — the same rules and engine as the Clan War page.
  const liveWar = useLiveWar({ clanTag, source: "war" });
  const { rules } = useRules();
  const now = useNow(30_000);

  const violationsByTag = useMemo(() => {
    const map = new Map<string, Violation[]>();
    if (!liveWar.war) return map;
    for (const v of evaluateRules(liveWar.war, rules, { now })) {
      const list = map.get(v.memberTag);
      if (list) list.push(v);
      else map.set(v.memberTag, [v]);
    }
    return map;
  }, [liveWar.war, rules, now]);

  const liveByTag = useMemo(() => {
    const map = new Map<string, LiveWar>();
    for (const [tag, list] of violationsByTag) {
      const broken = list.filter((v) => v.status === "violated").length;
      map.set(tag, { broken, atRisk: list.length - broken });
    }
    return map;
  }, [violationsByTag]);

  const members = data?.members ?? [];
  const watchCount = members.filter((m) => notes[m.tag]?.watch).length;
  const bonusCount = members.filter((m) => notes[m.tag]?.bonus).length;
  const warEnded = data?.war?.state === "warEnded";
  const raidEnded = data?.raid?.state === "ended";

  function isFlagged(m: Member): boolean {
    switch (tab) {
      case "war":
        return liveByTag.has(m.tag);
      case "cwl":
        return m.cwl.missedAttacks > 0;
      case "capital":
        return (m.capital.missedLastWeekend ?? 0) > 0;
      case "other":
        return Boolean(notes[m.tag]?.watch);
    }
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => (role === "all" || m.role === role) && (!q || m.name.toLowerCase().includes(q) || m.tag.toLowerCase().includes(q)) && (!flaggedOnly || isFlagged(m)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, query, role, flaggedOnly, tab, liveByTag, notes]);

  const summary = useMemo(
    () =>
      buildSummary(tab, members, {
        data,
        watchCount,
        bonusCount,
        liveBroken: [...liveByTag.values()].filter((l) => l.broken > 0).length,
        liveAtRisk: [...liveByTag.values()].filter((l) => l.broken === 0 && l.atRisk > 0).length,
      }),
    [tab, members, data, watchCount, bonusCount, liveByTag]
  );

  const updated = updatedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const selected = selectedTag ? (members.find((m) => m.tag === selectedTag) ?? null) : null;

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-[11px] font-semibold tracking-[0.16em] text-gold-dim">ROSTER</div>
        <h1 className="mt-5 font-display text-[40px] font-bold leading-none text-white">Members</h1>
        <p className="mt-3 text-sm text-muted">Everything about each member, from wars to capital raids.</p>
      </div>
      {clanTag !== null && (
        <button
          type="button"
          onClick={refresh}
          disabled={loading || refreshing}
          aria-label="Refresh members"
          title={updated ? `Updated ${updated}` : "Refresh"}
          className="mb-1 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-xs text-muted2 hover:text-white disabled:opacity-60"
        >
          <RefreshCw size={13} className={loading || refreshing ? "animate-spin" : ""} />
          {updated ? `Live · ${updated}` : "Refresh"}
        </button>
      )}
    </div>
  );

  if (clanTag === null) {
    return (
      <div className="px-12 pb-10 pt-10">
        {header}
        <div className="mt-9">
          <ClanTagForm onSave={setClanTag} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-12 pb-10 pt-10">
        {header}
        {loading ? (
          <Skeleton />
        ) : (
          <div role="alert" className="mt-9 rounded-xl border border-red-900/60 bg-red-950/30 px-6 py-8 text-sm text-red-200">
            <p>{error?.message ?? "Couldn't load the members."}</p>
            {error?.status === 404 && <p className="mt-1 text-red-200/70">Check the clan tag in Settings → Clan profile.</p>}
            <button type="button" onClick={refresh} className="mt-4 rounded-lg border border-red-800/70 px-3 py-1.5 text-xs font-bold text-red-100 hover:bg-red-900/40">
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---- the line under the tabs: what the table is showing right now
  let status: string;
  if (tab === "war") {
    if (data.war) {
      const end = data.war.endTime ? Date.parse(data.war.endTime) : NaN;
      const start = data.war.startTime ? Date.parse(data.war.startTime) : NaN;
      const timer =
        data.war.state === "inWar" && !Number.isNaN(end) ? ` · ${formatRemaining(end - now.getTime())} left` : data.war.state === "preparation" && !Number.isNaN(start) ? ` · starts in ${formatRemaining(start - now.getTime())}` : "";
      status = `${WAR_LABEL[data.war.state] ?? data.war.state} vs ${data.war.opponent ?? "the opponent"}${timer}`;
    } else {
      status = data.unavailable.includes("war") ? "War data is unavailable — the clan's war log is private." : "No war in progress. The table fills in when a war starts. If you're in CWL, open the CWL tab.";
    }
  } else if (tab === "cwl") {
    status = data.cwl
      ? `Season ${data.cwl.season ?? "?"} · ${data.cwl.roundsStarted} of ${data.cwl.roundsTotal} rounds started${data.cwl.currentRound?.opponent ? ` · round ${data.cwl.currentRound.round} vs ${data.cwl.currentRound.opponent}` : ""}`
      : "The clan isn't in a Clan War League right now.";
  } else if (tab === "capital") {
    status = data.raid ? `Raid weekend ${raidEnded ? "ended" : "live"} · totals cover the last ${data.raid.weekendsTracked} weekends` : "No raid weekends yet.";
  } else {
    status = "Donations and trophies are for the current season. Notes and the watch list are saved in this browser.";
  }

  const flagLabel = tab === "war" ? "Rule breakers only" : tab === "other" ? "Watch list only" : "Missed attacks only";

  return (
    <div className="px-12 pb-10 pt-10">
      {header}

      {error && (
        <p role="alert" className="mt-5 text-xs font-semibold text-amber-400">
          Couldn't refresh just now — showing the last data we got.
        </p>
      )}

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
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition ${active ? "border-gold text-gold" : "border-transparent text-muted2 hover:text-white"}`}
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
          {ROLE_ORDER.map((r) => (
            <option key={r} value={r}>
              {ROLE_META[r].title}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-pressed={flaggedOnly}
          onClick={() => setFlaggedOnly((v) => !v)}
          className={`flex h-[42px] items-center gap-2 rounded-lg border px-4 text-sm font-medium transition ${flaggedOnly ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-line bg-card text-muted2 hover:text-white"}`}
        >
          {tab === "other" ? <Eye size={15} /> : <ShieldAlert size={15} />}
          {flagLabel}
        </button>
        <span className="ml-auto text-xs text-muted">
          Showing {rows.length} of {members.length}
        </span>
      </div>

      <p className="mb-3 mt-5 text-xs text-muted2">{status}</p>

      {tab === "war" && <ClanWarTab rows={rows} liveByTag={liveByTag} warEnded={warEnded} onOpen={(m) => setSelectedTag(m.tag)} />}
      {tab === "cwl" && <CwlTab rows={rows} roundsTotal={data.cwl?.roundsTotal ?? 7} isBonus={(tag) => Boolean(notes[tag]?.bonus)} onOpen={(m) => setSelectedTag(m.tag)} />}
      {tab === "capital" && <CapitalTab rows={rows} weekendEnded={raidEnded} weekendsTracked={data.raid?.weekendsTracked ?? 0} onOpen={(m) => setSelectedTag(m.tag)} />}
      {tab === "other" && <OtherTab rows={rows} notes={notes} onOpen={(m) => setSelectedTag(m.tag)} />}

      {selected && (
        <MemberDetail
          key={selected.tag}
          member={selected}
          data={data}
          violations={violationsByTag.get(selected.tag) ?? []}
          note={notes[selected.tag]}
          onNote={setNote}
          onToggleWatch={toggleWatch}
          onToggleBonus={toggleBonus}
          onClose={() => setSelectedTag(null)}
        />
      )}
    </div>
  );
}
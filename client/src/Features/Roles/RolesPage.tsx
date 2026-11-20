import { useMemo } from "react";
import { RefreshCw, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { useClanData } from "../../lib/ClanDataProvider";
import ClanTagForm from "../ClanWars/components/ClanTagForm";
import StatCard from "../Home/components/Statcard";
import { useLayoutContext } from "../Layout/useLayoutContext";
import { roleLabel } from "../Members/components/ui";
import CriteriaPanel from "./components/CriteriaPanel";
import PlanPanel from "./components/PlanPanel";
import RoleBoard from "./components/RoleBoard";
import { PromotionPanel, ReviewPanel } from "./components/SuggestionPanels";
import { buildPromotions, buildReviews } from "./criteria";
import { useRoleChanges } from "./hooks/useRoleChanges";
import { useRoleCriteria } from "./hooks/useRoleCriteria";
import { useRoleMembers } from "./hooks/useRoleMembers";
import type { RoleMember, Role } from "./types";

export default function RolesPage() {
  const { setClanTag } = useClanData();
  const { clanTag, members, loading, refreshing, error, updatedAt, refresh } = useRoleMembers();
  const { criteria, setCriterion, reset } = useRoleCriteria();
  const { changes, addChange, toggleDone, removeChange, clearDone } = useRoleChanges();
  const { showToast } = useLayoutContext();

  const promotions = useMemo(() => buildPromotions(members, criteria), [members, criteria]);
  const reviews = useMemo(() => buildReviews(members, criteria), [members, criteria]);

  const readyTags = useMemo(() => new Set(promotions.filter((p) => p.ready).map((p) => p.member.tag)), [promotions]);
  const reviewTags = useMemo(() => new Set(reviews.map((r) => r.member.tag)), [reviews]);
  const plannedTags = useMemo(() => new Set(changes.filter((c) => !c.done).map((c) => c.tag)), [changes]);

  const count = (role: string) => members.filter((m) => m.role === role).length;
  const staff = members.filter((m) => m.role !== "member").length;
  const updated = updatedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  function plan(member: RoleMember, to: Role, reason: string) {
    addChange({ tag: member.tag, name: member.name, from: member.role, to, reason });
    showToast(`${member.name}: ${roleLabel(member.role)} → ${roleLabel(to)} added to your to-do list`);
  }

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-[11px] font-semibold tracking-[0.16em] text-gold-dim">HIERARCHY</div>
        <h1 className="mt-5 font-display text-[40px] font-bold leading-none text-white">Roles</h1>
        <p className="mt-3 text-sm text-muted">See who leads, and let the numbers point out who has earned a promotion.</p>
      </div>
      {clanTag !== null && (
        <button
          type="button"
          onClick={refresh}
          disabled={loading || refreshing}
          aria-label="Refresh roster"
          title={updated ? `Updated ${updated}` : "Refresh"}
          className="mb-1 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-xs text-muted2 hover:text-white disabled:opacity-60"
        >
          <RefreshCw size={13} className={loading || refreshing ? "animate-spin" : ""} />
          {updated ? `Live · ${updated}` : "Refresh"}
        </button>
      )}
    </div>
  );

  // ---- nothing to show yet
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

  if (members.length === 0) {
    return (
      <div className="px-12 pb-10 pt-10">
        {header}
        <div
          role={error ? "alert" : "status"}
          className={`mt-9 rounded-xl border px-6 py-8 text-sm ${error ? "border-red-900/60 bg-red-950/30 text-red-200" : "border-line bg-card text-muted2"}`}
        >
          {loading ? (
            "Loading your clan's members…"
          ) : (
            <>
              <p>{error?.message ?? "No members were found for this clan."}</p>
              {error?.status === 404 && <p className="mt-1 text-red-200/70">Check the clan tag in Settings → Clan profile.</p>}
              <button type="button" onClick={refresh} className="mt-4 rounded-lg border border-red-800/70 px-3 py-1.5 text-xs font-bold text-red-100 hover:bg-red-900/40">
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-12 pb-10 pt-10">
      {header}

      {error && (
        <p role="alert" className="mt-5 text-xs font-semibold text-amber-400">
          Couldn't refresh just now — showing the last data we got.
        </p>
      )}

      <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leadership team" value={String(staff)} sub={`${count("leader")} Leader · ${count("coLeader")} Co-leaders · ${count("admin")} Elders`} icon={Users} tone="gold" />
        <StatCard label="Clan members" value={String(members.length)} suffix="/ 50" sub={`${count("member")} regular members`} icon={Users} tone="blue" />
        <StatCard label="Promotion ready" value={String(readyTags.size)} sub={`${promotions.length - readyTags.size} almost there`} subTone={readyTags.size > 0 ? "green" : "muted"} icon={TrendingUp} tone="purple" />
        <StatCard label="Needs review" value={String(reviews.length)} sub={`${changes.filter((c) => !c.done).length} change(s) on your to-do list`} icon={ShieldAlert} tone="red" />
      </div>

      <p className="mt-4 max-w-3xl text-[11px] text-muted">
        Suggestions use what the game provides: season donations, attacks in the current war and the latest raid weekend, and rules broken in the current war.
        War history, clan games and join dates aren't available from the game yet, so those checks are skipped.
      </p>

      <div className="mt-5 space-y-5">
        <RoleBoard members={members} readyTags={readyTags} reviewTags={reviewTags} />

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          <PromotionPanel
            suggestions={promotions}
            plannedTags={plannedTags}
            onPlan={(s) =>
              plan(s.member, s.to, s.ready ? "Meets every promotion check that has data" : `Close — still missing: ${s.failing.map((f) => f.label.toLowerCase()).join(", ")}`)
            }
          />
          <ReviewPanel suggestions={reviews} plannedTags={plannedTags} onPlan={(s) => plan(s.member, s.to, s.reasons.join("; "))} />
        </div>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          <PlanPanel changes={changes} onToggle={toggleDone} onRemove={removeChange} onClearDone={clearDone} />
          <CriteriaPanel criteria={criteria} onChange={setCriterion} onReset={reset} />
        </div>
      </div>
    </div>
  );
}
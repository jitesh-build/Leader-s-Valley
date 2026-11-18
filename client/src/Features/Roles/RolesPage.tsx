import { useMemo } from "react";
import { Info, ShieldAlert, TrendingUp, Users } from "lucide-react";
import StatCard from "../Home/components/Statcard";
import { useLayoutContext } from "../Layout/useLayoutContext";
import { useMembers } from "../Members/hooks/useMembers";
import { roleLabel } from "../Members/components/ui";
import type { Member, Role } from "../Members/types";
import CriteriaPanel from "./components/CriteriaPanel";
import PlanPanel from "./components/PlanPanel";
import RoleBoard from "./components/RoleBoard";
import { PromotionPanel, ReviewPanel } from "./components/SuggestionPanels";
import { buildPromotions, buildReviews } from "./criteria";
import { useRoleChanges } from "./hooks/useRoleChanges";
import { useRoleCriteria } from "./hooks/useRoleCriteria";

export default function RolesPage() {
  const { members, isSample } = useMembers();
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

  function plan(member: Member, to: Role, reason: string) {
    addChange({ tag: member.tag, name: member.name, from: member.role, to, reason });
    showToast(`${member.name}: ${roleLabel(member.role)} → ${roleLabel(to)} added to your to-do list`);
  }

  return (
    <div className="px-12 pb-10 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.16em] text-gold-dim">HIERARCHY</div>
          <h1 className="mt-5 font-display text-[40px] font-bold leading-none text-white">Roles</h1>
          <p className="mt-3 text-sm text-muted">See who leads, and let the numbers point out who has earned a promotion.</p>
        </div>
        {isSample && (
          <div className="mb-1 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-xs text-muted2">
            <Info size={14} className="text-gold" />
            Sample data — connect the Clash of Clans API to go live
          </div>
        )}
      </div>

      <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leadership team" value={String(staff)} sub={`${count("leader")} Leader · ${count("coLeader")} Co-leaders · ${count("admin")} Elders`} icon={Users} tone="gold" />
        <StatCard label="Clan members" value={String(members.length)} suffix="/ 50" sub={`${count("member")} regular members`} icon={Users} tone="blue" />
        <StatCard label="Promotion ready" value={String(readyTags.size)} sub={`${promotions.length - readyTags.size} almost there`} subTone={readyTags.size > 0 ? "green" : "muted"} icon={TrendingUp} tone="purple" />
        <StatCard label="Needs review" value={String(reviews.length)} sub={`${changes.filter((c) => !c.done).length} change(s) on your to-do list`} icon={ShieldAlert} tone="red" />
      </div>

      <div className="mt-5 space-y-5">
        <RoleBoard members={members} readyTags={readyTags} reviewTags={reviewTags} />

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          <PromotionPanel
            suggestions={promotions}
            plannedTags={plannedTags}
            onPlan={(s) =>
              plan(s.member, s.to, s.ready ? "Meets every promotion criterion" : `Close — still missing: ${s.failing.map((f) => f.label.toLowerCase()).join(", ")}`)
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
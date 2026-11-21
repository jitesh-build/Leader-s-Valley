import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, Check, Eye, ListPlus, ShieldCheck } from "lucide-react";
import type { PromotionSuggestion, ReviewSuggestion } from "../types";
import { CheckIcon, CheckStrip, Pill, RoleChip, TownHall } from "./ui";

function PlanButton({ planned, onClick }: { planned: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={planned}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
        planned ? "cursor-default border-line text-muted" : "border-gold/40 text-gold hover:bg-gold/10"
      }`}
    >
      {planned ? <Check size={13} /> : <ListPlus size={13} />}
      {planned ? "On to-do list" : "Add to to-do"}
    </button>
  );
}

function DetailsButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Details for ${name}`}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted2 transition hover:bg-white/5 hover:text-white"
    >
      <Eye size={13} /> Details
    </button>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-5 py-9 text-center">
      <span className="text-gold">{icon ?? <ShieldCheck size={28} strokeWidth={1.6} />}</span>
      <div className="mt-3 font-display text-lg font-bold text-white">{title}</div>
      <p className="mt-1 max-w-[280px] text-xs text-muted">{children}</p>
    </div>
  );
}

interface PromotionProps {
  suggestions: PromotionSuggestion[];
  plannedTags: Set<string>;
  onPlan: (s: PromotionSuggestion) => void;
  onOpen: (tag: string) => void;
}

export function PromotionList({ suggestions, plannedTags, onPlan, onOpen }: PromotionProps) {
  return (
    <div>
      <p className="mb-4 text-xs text-muted">
        Members who pass every check that has data, or miss just one. Checks the game gives no data for are greyed out and skipped.
      </p>
      {suggestions.length === 0 ? (
        <EmptyState title="No one is close yet">Nobody is near a promotion with the current criteria. Tune them in the Criteria tab.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s) => {
            const known = s.results.length - s.unknown.length;
            return (
              <li key={s.member.tag} className={`rounded-xl border bg-panel p-4 ${s.ready ? "border-green-500/30" : "border-line"}`}>
                <div className="flex items-start gap-3">
                  <TownHall level={s.member.townHallLevel} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-bold text-white">{s.member.name}</span>
                      <Pill tone={s.ready ? "green" : "amber"}>{s.ready ? "READY" : "ALMOST"}</Pill>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <RoleChip role={s.member.role} />
                      <ArrowRight size={12} className="text-muted" />
                      <RoleChip role={s.to} />
                    </div>
                  </div>
                </div>

                <div className="mt-3.5">
                  <CheckStrip statuses={s.results.map((r) => r.status)} />
                  <div className="mt-1 text-[10px] text-muted">
                    {s.results.filter((r) => r.status === "pass").length} of {known} checks passed · {s.unknown.length} without data
                  </div>
                </div>

                <ul className="mt-3 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
                  {s.results.map((r) => (
                    <li key={r.id} title={r.detail} className={`flex items-center gap-1.5 text-[11px] ${r.status === "unknown" ? "text-muted" : "text-white/85"}`}>
                      <CheckIcon status={r.status} size={12} />
                      <span className="truncate">{r.label}</span>
                    </li>
                  ))}
                </ul>
                {s.failing.map((f) => (
                  <p key={f.id} className="mt-2 text-[11px] text-red-300/90">
                    Missing: <span className="text-muted2">{f.detail}</span>
                  </p>
                ))}

                <div className="mt-3.5 flex items-center justify-end gap-1.5">
                  <DetailsButton name={s.member.name} onClick={() => onOpen(s.member.tag)} />
                  <PlanButton planned={plannedTags.has(s.member.tag)} onClick={() => onPlan(s)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface ReviewProps {
  suggestions: ReviewSuggestion[];
  plannedTags: Set<string>;
  onPlan: (s: ReviewSuggestion) => void;
  onOpen: (tag: string) => void;
}

export function ReviewList({ suggestions, plannedTags, onPlan, onOpen }: ReviewProps) {
  return (
    <div>
      <p className="mb-4 text-xs text-muted">Elders and Co-leaders whose numbers have slipped. A flag is a prompt to talk, not a verdict.</p>
      {suggestions.length === 0 ? (
        <EmptyState title="All clear">No Elder or Co-leader is flagged right now.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s) => (
            <li key={s.member.tag} className="rounded-xl border border-amber-500/25 bg-panel p-4">
              <div className="flex items-start gap-3">
                <TownHall level={s.member.townHallLevel} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-white">{s.member.name}</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <RoleChip role={s.member.role} />
                    <ArrowRight size={12} className="text-muted" />
                    <RoleChip role={s.to} />
                  </div>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {s.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-xs text-amber-300">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
              <div className="mt-3.5 flex items-center justify-end gap-1.5">
                <DetailsButton name={s.member.name} onClick={() => onOpen(s.member.tag)} />
                <PlanButton planned={plannedTags.has(s.member.tag)} onClick={() => onPlan(s)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
import type { ReactNode } from "react";
import { ArrowRight, Check, ListPlus, ShieldCheck, X } from "lucide-react";
import { RoleBadge } from "../../Members/components/ui";
import type { PromotionSuggestion, ReviewSuggestion } from "../types";

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

function PanelShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-card p-6">
      <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">{eyebrow}</div>
      <h2 className="mt-2 font-display text-[26px] font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mt-5 flex items-center gap-4 rounded-xl bg-panel p-4">
      <ShieldCheck size={26} className="shrink-0 text-gold" strokeWidth={1.6} />
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

export function PromotionPanel({
  suggestions,
  plannedTags,
  onPlan,
}: {
  suggestions: PromotionSuggestion[];
  plannedTags: Set<string>;
  onPlan: (s: PromotionSuggestion) => void;
}) {
  return (
    <PanelShell eyebrow="AUTO-CHECK" title="Promotion candidates">
      <p className="mt-1 text-xs text-muted">Members who pass every check, or miss just one. Tune the checks in “Criteria”.</p>
      {suggestions.length === 0 ? (
        <Empty text="Nobody is close to a promotion with the current criteria." />
      ) : (
        <ul className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {suggestions.map((s) => (
            <li key={s.member.tag} className="rounded-xl bg-panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-white">{s.member.name}</span>
                  <RoleBadge role={s.member.role} />
                  <ArrowRight size={13} className="text-muted" />
                  <RoleBadge role={s.to} />
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${
                      s.ready ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {s.ready ? "READY" : "ALMOST"}
                  </span>
                </div>
                <PlanButton planned={plannedTags.has(s.member.tag)} onClick={() => onPlan(s)} />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.results.map((r) => (
                  <span
                    key={r.id}
                    title={r.detail}
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      r.pass ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {r.pass ? <Check size={10} /> : <X size={10} />}
                    {r.label}
                  </span>
                ))}
              </div>
              {s.failing.map((f) => (
                <p key={f.id} className="mt-2 text-[11px] text-muted">
                  Missing: <span className="text-muted2">{f.detail}</span>
                </p>
              ))}
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

export function ReviewPanel({
  suggestions,
  plannedTags,
  onPlan,
}: {
  suggestions: ReviewSuggestion[];
  plannedTags: Set<string>;
  onPlan: (s: ReviewSuggestion) => void;
}) {
  return (
    <PanelShell eyebrow="AUTO-CHECK" title="Needs a review">
      <p className="mt-1 text-xs text-muted">Elders and Co-leaders whose record has slipped. A flag is a prompt to talk, not a verdict.</p>
      {suggestions.length === 0 ? (
        <Empty text="No Elder or Co-leader is flagged right now." />
      ) : (
        <ul className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {suggestions.map((s) => (
            <li key={s.member.tag} className="rounded-xl bg-panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-white">{s.member.name}</span>
                  <RoleBadge role={s.member.role} />
                  <ArrowRight size={13} className="text-muted" />
                  <RoleBadge role={s.to} />
                </div>
                <PlanButton planned={plannedTags.has(s.member.tag)} onClick={() => onPlan(s)} />
              </div>
              <ul className="mt-3 space-y-1 text-xs text-amber-400">
                {s.reasons.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
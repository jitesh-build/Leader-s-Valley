import { Pencil, Plus, Trash2 } from "lucide-react";
import { RULE_TYPES } from "../rules/definitions";
import { PHASE_LABEL, rulePhase } from "../rules/phase";
import type { Rule, RulePhase } from "../rules/types";
import FloatingPanel from "./FloatingPanel";
import { OUTLINE, SOFT } from "./outline";

interface Props {
  rules: Rule[];
  countByRule: Record<string, number>;
  /** Which phase the current war is in (its rules are the ones being checked right now). */
  activePhase?: RulePhase | null;
  onAdd: () => void;
  onEdit: (rule: Rule) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const PHASES: RulePhase[] = ["preparation", "battle"];

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative h-5 w-9 shrink-0 rounded-full border border-black/50 transition ${on ? "bg-gold" : "bg-white/20"}`}
    >
      <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

export default function RulesPanel({ rules, countByRule, activePhase = null, onAdd, onEdit, onToggle, onDelete, onClose }: Props) {
  function renderRule(rule: Rule) {
    const def = rule.type === "manual" ? null : RULE_TYPES[rule.type];
    const detail = def ? def.describe(rule.params) : rule.note;
    const breaking = countByRule[rule.id] ?? 0;
    return (
      <li
        key={rule.id}
        className={`flex items-start gap-3 rounded-lg border border-white/10 bg-black/40 p-3.5 transition ${rule.enabled ? "" : "opacity-50"}`}
      >
        {def ? (
          <Switch on={rule.enabled} onClick={() => onToggle(rule.id)} label={`Toggle rule: ${rule.title}`} />
        ) : (
          <span className="w-9 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold leading-snug text-white" style={OUTLINE}>
            {rule.title}
          </div>
          {detail && detail !== rule.title && (
            <div className="mt-0.5 text-xs text-white/60" style={SOFT}>
              {detail}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold tracking-wider">
            <span className={`rounded px-1.5 py-0.5 ${def ? "bg-gold/15 text-gold" : "bg-white/15 text-white/80"}`}>{def ? "AUTO" : "MANUAL"}</span>
            <span className={`rounded px-1.5 py-0.5 ${rule.severity === "major" ? "bg-red-500/25 text-red-300" : "bg-amber-500/25 text-amber-300"}`}>
              {rule.severity === "major" ? "MAJOR" : "MINOR"}
            </span>
            {def && rule.enabled && breaking > 0 && <span className="text-red-300">{breaking} FLAGGED</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => onEdit(rule)}
            aria-label={`Edit rule: ${rule.title}`}
            className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this rule?")) onDelete(rule.id);
            }}
            aria-label={`Delete rule: ${rule.title}`}
            className="rounded-md p-1.5 text-white/60 transition hover:bg-red-500/20 hover:text-red-300"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </li>
    );
  }

  return (
    <FloatingPanel
      eyebrow="LEADER'S LAW"
      title="Clan rules"
      onClose={onClose}
      action={
        <button
          onClick={onAdd}
          className="flex h-[34px] items-center gap-1.5 rounded-lg bg-gradient-to-b from-gold-soft to-gold px-3 text-xs font-bold text-[#1a1405] shadow-lg shadow-black/30 transition hover:brightness-110"
        >
          <Plus size={14} /> Add rule
        </button>
      }
    >
      {rules.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-white/70" style={SOFT}>
          No rules yet. Add one to start checking the war automatically.
        </p>
      ) : (
        PHASES.map((phase) => {
          const list = rules.filter((r) => rulePhase(r) === phase);
          return (
            <section key={phase} className="mb-5 last:mb-0">
              <h3 className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-white/70" style={OUTLINE}>
                {PHASE_LABEL[phase].toUpperCase()}
                {activePhase === phase && <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold">ACTIVE NOW</span>}
              </h3>
              {list.length === 0 ? (
                <p className="text-xs text-white/50" style={SOFT}>
                  No rules for this phase.
                </p>
              ) : (
                <ul className="space-y-2.5">{list.map(renderRule)}</ul>
              )}
            </section>
          );
        })
      )}
    </FloatingPanel>
  );
}
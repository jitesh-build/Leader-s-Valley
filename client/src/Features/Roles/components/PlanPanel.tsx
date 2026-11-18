import { ArrowRight, Check, X } from "lucide-react";
import { RoleBadge } from "../../Members/components/ui";
import type { PlannedChange } from "../types";

interface Props {
  changes: PlannedChange[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onClearDone: () => void;
}

export default function PlanPanel({ changes, onToggle, onRemove, onClearDone }: Props) {
  const pending = changes.filter((c) => !c.done).length;
  const hasDone = changes.some((c) => c.done);

  return (
    <section className="rounded-xl border border-line bg-card p-6">
      <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">IN-GAME TO-DO</div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <h2 className="font-display text-[26px] font-bold text-white">
          Role changes <span className="text-muted2">· {pending}</span>
        </h2>
        {hasDone && (
          <button onClick={onClearDone} className="text-xs text-muted hover:text-white">
            Clear completed
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">The Clash of Clans API is read-only — make each change in-game, then tick it off here.</p>

      {changes.length === 0 ? (
        <p className="mt-5 rounded-xl bg-panel p-4 text-sm text-muted">Nothing planned. Use “Add to to-do” on a suggestion.</p>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {changes.map((c) => (
            <li key={c.id} className={`flex items-start gap-3 rounded-xl bg-panel p-4 ${c.done ? "opacity-50" : ""}`}>
              <button
                type="button"
                role="checkbox"
                aria-checked={c.done}
                aria-label={`Mark ${c.name}'s role change as done`}
                onClick={() => onToggle(c.id)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                  c.done ? "border-gold bg-gold text-[#1a1405]" : "border-line hover:border-gold/60"
                }`}
              >
                {c.done && <Check size={12} strokeWidth={3} />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-semibold text-white ${c.done ? "line-through" : ""}`}>{c.name}</span>
                  <RoleBadge role={c.from} />
                  <ArrowRight size={13} className="text-muted" />
                  <RoleBadge role={c.to} />
                </div>
                <div className="mt-1 text-xs text-muted">{c.reason}</div>
              </div>
              <button
                onClick={() => onRemove(c.id)}
                aria-label={`Remove ${c.name} from the list`}
                className="rounded-md p-1.5 text-muted transition hover:bg-red-500/10 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
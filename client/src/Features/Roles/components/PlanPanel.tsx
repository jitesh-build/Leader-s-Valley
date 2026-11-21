import { ArrowRight, Check, ListChecks, X } from "lucide-react";
import type { PlannedChange } from "../types";
import { EmptyState } from "./Suggestions";
import { RoleChip } from "./ui";

interface Props {
  changes: PlannedChange[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onClearDone: () => void;
}

/** The leader's in-game to-do list (the official API is read-only, so changes are made in the game and ticked off here). */
export default function PlanPanel({ changes, onToggle, onRemove, onClearDone }: Props) {
  const pending = changes.filter((c) => !c.done).length;
  const hasDone = changes.some((c) => c.done);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-xs text-muted">
          The Clash of Clans API is read-only — make each change in the game, then tick it off here. <span className="text-muted2">{pending} to do.</span>
        </p>
        {hasDone && (
          <button type="button" onClick={onClearDone} className="shrink-0 text-xs text-muted hover:text-white">
            Clear completed
          </button>
        )}
      </div>

      {changes.length === 0 ? (
        <EmptyState icon={<ListChecks size={28} strokeWidth={1.6} />} title="Nothing planned">
          Use “Add to to-do” on a suggestion, or open a player's details.
        </EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {changes.map((c) => (
            <li key={c.id} className={`flex items-start gap-3 rounded-xl border border-line bg-panel p-4 ${c.done ? "opacity-50" : ""}`}>
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
                <div className={`text-sm font-bold text-white ${c.done ? "line-through" : ""}`}>{c.name}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <RoleChip role={c.from} />
                  <ArrowRight size={12} className="text-muted" />
                  <RoleChip role={c.to} />
                </div>
                <div className="mt-1.5 text-xs text-muted">{c.reason}</div>
              </div>
              <button
                type="button"
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
    </div>
  );
}
import React, { useMemo, useState } from "react";
import type { Slot, StarCount } from "../types";
import { STAR_COUNTS, STAR_TIER_CLASSES } from "../lib/starTiers";

interface SlotBoardProps {
  slots: Slot[];
  activeSlotId: string | null;
  /** slot id currently "armed" to receive the next enemy pip click into its multi-select pool */
  poolAddArmedSlotId: string | null;
  onSelectSlot: (id: string) => void;
  onSetStars: (id: string, stars: StarCount) => void;
  onClearSlot: (id: string) => void;
  onToggleMultiSelect: (id: string) => void;
  onArmAddEnemyBase: (id: string) => void;
  onRemoveEnemyBase: (id: string, baseNumber: number) => void;
  onAutoFillRemaining: () => void;
  errorBySlotId: Record<string, string>;
}

type SortMode = "index" | "asc" | "desc";
 
const SORT_OPTIONS: { mode: SortMode; label: string; title: string }[] = [
  { mode: "index", label: "Slot #", title: "Original slot order" },
  { mode: "asc", label: "Base # ↑", title: "Team base number, lowest first (unassigned slots last)" },
  { mode: "desc", label: "Base # ↓", title: "Team base number, highest first (unassigned slots last)" },
];

/** Small crosshair glyph used for the multi-target toggle — no icon library dependency required. */
function CrosshairIcon({ active }: { active: boolean }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="7" />
      <line x1="12" y1="1" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="1" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="23" y2="12" />
    </svg>
  );
}

export default function SlotBoard({
  slots,
  activeSlotId,
  poolAddArmedSlotId,
  onSelectSlot,
  onSetStars,
  onClearSlot,
  onToggleMultiSelect,
  onArmAddEnemyBase,
  onRemoveEnemyBase,
  onAutoFillRemaining,
  errorBySlotId,
}: SlotBoardProps): React.ReactElement {
  const canAutoFill = slots.some((s) => s.teamBaseNumber === null);
  const [sortMode, setSortMode] = useState<SortMode>("index");

  // Display-only ordering — the underlying `slots` array (and anything that
  // relies on it, like auto-advance to the next empty slot) is untouched.
  // Slots without a team base always sink to the bottom, in slot order.
  const sortedSlots = useMemo(() => {
    if (sortMode === "index") return slots;
    const dir = sortMode === "asc" ? 1 : -1;
    return [...slots].sort((a, b) => {
      const an = a.teamBaseNumber;
      const bn = b.teamBaseNumber;
      if (an === null && bn === null) return a.index - b.index;
      if (an === null) return 1;
      if (bn === null) return -1;
      return (an - bn) * dir;
    });
  }, [slots, sortMode]);
 
  const totalStars = useMemo(() => slots.reduce((sum, s) => sum + s.starsNeeded, 0), [slots]);
  const maxStars = slots.length * 3;

  return (
    <div className="rounded-lg border border-base-border bg-base-panel/80">
      <div className="border-b border-base-border px-4 py-3">
        <h3 className="font-display text-sm uppercase tracking-widest text-ink-muted">
          Attack Slots
          <span className="ml-2 font-mono text-xs normal-case text-ink-faint">
            select a slot, then tap a base up top · tap the crosshair to allow multiple enemy targets
          </span>
        </h3>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-ink-faint">Sort by</span>
            <div className="flex overflow-hidden rounded border border-base-border" role="group" aria-label="Sort slots">
              {SORT_OPTIONS.map((opt, i) => (
                <button
                  key={opt.mode}
                  type="button"
                  title={opt.title}
                  aria-pressed={sortMode === opt.mode}
                  onClick={() => setSortMode(opt.mode)}
                  className={[
                    "px-2.5 py-1 font-mono text-[11px] transition",
                    i > 0 ? "border-l border-base-border" : "",
                    sortMode === opt.mode
                      ? "bg-team/20 text-team-bright"
                      : "text-ink-faint hover:text-ink-muted",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
 
          <div
            className="flex items-baseline gap-2 font-mono text-xs text-ink-faint"
            title="Sum of “stars needed” across all slots"
          >
            <span className="text-[10px] uppercase tracking-wide">Total stars</span>
            <span className="text-base font-semibold text-ink-primary">{totalStars}★</span>
            <span>/ {maxStars}★</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedSlots.map((slot) => {
          const isActive = slot._id === activeSlotId;
          const isArmed = poolAddArmedSlotId === slot._id;
          const isFilled = slot.isMultiSelect
            ? slot.teamBaseNumber !== null && slot.enemyBaseNumbers.length > 0
            : slot.teamBaseNumber !== null && slot.enemyBaseNumber !== null;
          const error = errorBySlotId[slot._id];

          return (
            <div
              key={slot._id}
              onClick={() => onSelectSlot(slot._id)}
              className={[
                "cursor-pointer rounded-lg border p-3 transition",
                isActive
                  ? "border-team bg-team/10 ring-1 ring-team-bright"
                  : isFilled
                    ? "border-ok/40 bg-base-panel2/50 hover:border-ok"
                    : "border-base-border bg-base-panel2/30 hover:border-borderLight",
              ].join(" ")}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                  Slot {slot.index}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title={slot.isMultiSelect ? "Multi-target on — click to switch back to a single target" : "Click to allow multiple enemy targets"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMultiSelect(slot._id);
                    }}
                    className={[
                      "flex h-5 w-5 items-center justify-center rounded border transition",
                      slot.isMultiSelect
                        ? "border-team bg-team/20 text-team-bright"
                        : "border-base-border text-ink-faint hover:border-borderLight hover:text-ink-muted",
                    ].join(" ")}
                  >
                    <CrosshairIcon active={slot.isMultiSelect} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearSlot(slot._id);
                    }}
                    className="text-[10px] uppercase tracking-wide text-ink-faint hover:text-enemy-bright"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mb-2 flex items-start gap-2">
                <div className="flex h-9 flex-1 items-center justify-center rounded border border-team-dim bg-team/10 font-mono text-sm text-team-bright">
                  {slot.teamBaseNumber !== null ? `#${slot.teamBaseNumber}` : "select"}
                </div>
                <span className="mt-2 font-mono text-xs text-ink-faint">vs</span>

                {slot.isMultiSelect ? (
                  <div className="flex flex-1 flex-wrap gap-1">
                    {slot.enemyBaseNumbers.map((n) => (
                      <span
                        key={n}
                        className="flex items-center gap-1 rounded border border-enemy-dim bg-enemy/10 px-1.5 py-1 font-mono text-xs text-enemy-bright"
                      >
                        #{n}
                        <button
                          type="button"
                          title={`Remove base #${n} from this slot's pool`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveEnemyBase(slot._id, n);
                          }}
                          className="leading-none text-enemy-bright/70 hover:text-enemy-bright"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      title="Add another enemy base to this slot"
                      onClick={(e) => {
                        e.stopPropagation();
                        onArmAddEnemyBase(slot._id);
                      }}
                      className={[
                        "rounded border border-dashed px-2 py-1 font-mono text-xs transition",
                        isArmed
                          ? "border-team bg-team/10 text-team-bright"
                          : "border-base-border text-ink-faint hover:border-borderLight hover:text-ink-muted",
                      ].join(" ")}
                    >
                      {isArmed ? "tap a base above…" : "+ new"}
                    </button>
                  </div>
                ) : (
                  <div className="flex h-9 flex-1 items-center justify-center rounded border border-enemy-dim bg-enemy/10 font-mono text-sm text-enemy-bright">
                    {slot.enemyBaseNumber !== null ? `#${slot.enemyBaseNumber}` : "select"}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide text-ink-faint">Stars needed</span>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {STAR_COUNTS.map((n) => {
                    const selected = slot.starsNeeded === n;
                    const tier = STAR_TIER_CLASSES[n];
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => onSetStars(slot._id, n)}
                        className={[
                          "h-6 w-6 rounded border font-mono text-[11px] transition",
                          selected ? `${tier.bg} ${tier.border} ${tier.text}` : "border-base-border text-ink-faint hover:border-borderLight",
                        ].join(" ")}
                      >
                        {n}★
                      </button>
                    );
                  })}
                </div>
              </div>

              {error ? <p className="mt-2 text-[11px] text-enemy-bright">{error}</p> : null}
            </div>
          );
        })}
      </div>

      <div className="border-t border-base-border p-4">
        <button
          type="button"
          disabled={!canAutoFill}
          onClick={onAutoFillRemaining}
          title="Turn every still-empty slot into a multi-select slot: one remaining team base each, all sharing the full pool of remaining enemy bases"
          className="w-full rounded border border-team-dim px-4 py-2 text-sm font-semibold uppercase tracking-wide text-team-bright transition hover:border-team hover:bg-team/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Fill remaining slots (multi-target)
        </button>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { Star } from "lucide-react";
import type { Slot, StarCount } from "../types";
import SlotCard from "./SlotCard";
import { OUTLINE, SOFT } from "../lib/outline";
import { BTN_BEIGE, PANEL } from "../lib/gameStyles";

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
    <section aria-label="Attack slots" className="space-y-5">
      <div className={`${PANEL} px-5 py-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold tracking-[0.14em] text-gold-dim">ATTACK PLAN</div>
            <h2 className="font-display text-2xl font-bold leading-tight text-white" style={OUTLINE}>
              Attack slots
            </h2>
            <p className="mt-1 max-w-xl text-xs text-white/70" style={SOFT}>
              Select a slot, then tap a base in the panel above · tap the crosshair to allow multiple enemy targets
            </p>
          </div>

          <div className="flex items-center gap-2" title="Sum of “stars needed” across all slots">
            <Star size={22} className="fill-gold text-gold" />
            <div className="leading-tight">
              <div className="text-2xl font-extrabold text-white" style={OUTLINE}>
                {totalStars}
                <span className="text-sm font-bold text-white/60"> / {maxStars}</span>
              </div>
              <div className="text-[10px] font-bold tracking-[0.14em] text-white/60">TOTAL STARS</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold tracking-[0.14em] text-white/60">SORT BY</span>
          <div className="flex overflow-hidden rounded-lg border border-line" role="group" aria-label="Sort slots">
            {SORT_OPTIONS.map((opt, i) => (
              <button
                key={opt.mode}
                type="button"
                title={opt.title}
                aria-pressed={sortMode === opt.mode}
                onClick={() => setSortMode(opt.mode)}
                className={[
                  "px-3 py-1.5 text-xs font-bold transition",
                  i > 0 ? "border-l border-line" : "",
                  sortMode === opt.mode ? "bg-gold/20 text-gold" : "text-white/60 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two columns. The wide middle gap is where the arena's stone path runs (path 44px + 14px each side). */}
      <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-x-[72px]">
        {sortedSlots.map((slot) => (
          <SlotCard
            key={slot._id}
            slot={slot}
            isActive={slot._id === activeSlotId}
            isArmed={poolAddArmedSlotId === slot._id}
            {...(errorBySlotId[slot._id] !== undefined ? { error: errorBySlotId[slot._id] } : {})}
            onSelect={() => onSelectSlot(slot._id)}
            onSetStars={(stars) => onSetStars(slot._id, stars)}
            onClear={() => onClearSlot(slot._id)}
            onToggleMultiSelect={() => onToggleMultiSelect(slot._id)}
            onArmAddEnemyBase={() => onArmAddEnemyBase(slot._id)}
            onRemoveEnemyBase={(n) => onRemoveEnemyBase(slot._id, n)}
          />
        ))}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          disabled={!canAutoFill}
          onClick={onAutoFillRemaining}
          title="Turn every still-empty slot into a multi-select slot: one remaining team base each, all sharing the full pool of remaining enemy bases"
          className={`${BTN_BEIGE} px-6 py-3 text-sm uppercase tracking-wide`}
        >
          Fill remaining slots (multi-target)
        </button>
      </div>
    </section>
  );
}
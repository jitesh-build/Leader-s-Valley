import React from "react";
import type { Slot, StarCount } from "../types";
import { STAR_COUNTS, STAR_TIER_CLASSES } from "../lib/starTiers";

interface SlotBoardProps {
  slots: Slot[];
  activeSlotId: string | null;
  onSelectSlot: (id: string) => void;
  onSetStars: (id: string, stars: StarCount) => void;
  onClearSlot: (id: string) => void;
  errorBySlotId: Record<string, string>;
}

export default function SlotBoard({
  slots,
  activeSlotId,
  onSelectSlot,
  onSetStars,
  onClearSlot,
  errorBySlotId,
}: SlotBoardProps): React.ReactElement {
  return (
    <div className="rounded-lg border border-base-border bg-base-panel/80">
      <div className="border-b border-base-border px-4 py-3">
        <h3 className="font-display text-sm uppercase tracking-widest text-ink-muted">
          Attack Slots
          <span className="ml-2 font-mono text-xs normal-case text-ink-faint">
            select a slot, then tap a base up top
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => {
          const isActive = slot._id === activeSlotId;
          const isFilled = slot.teamBaseNumber !== null && slot.enemyBaseNumber !== null;
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

              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-9 flex-1 items-center justify-center rounded border border-team-dim bg-team/10 font-mono text-sm text-team-bright">
                  {slot.teamBaseNumber !== null ? `#${slot.teamBaseNumber}` : "select"}
                </div>
                <span className="font-mono text-xs text-ink-faint">vs</span>
                <div className="flex h-9 flex-1 items-center justify-center rounded border border-enemy-dim bg-enemy/10 font-mono text-sm text-enemy-bright">
                  {slot.enemyBaseNumber !== null ? `#${slot.enemyBaseNumber}` : "select"}
                </div>
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
    </div>
  );
}

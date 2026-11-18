
import React from "react";
import type { EnemyScout, Slot, StarCount, War, WarSummary } from "../types";
import BasePips, { EnemyBaseOwnership } from "./BasePips";
import { OUTLINE, SOFT } from "../lib/outline";

interface StatsBarProps {
  war: War;
  summary: WarSummary;
  slots: Slot[];
  enemyScouts: EnemyScout[];
  activeSlotId: string | null;
  /** slot id currently "armed" to receive the next enemy pip click into its multi-select pool */
  poolAddArmedSlotId: string | null;
  onPickTeamBase: (n: number) => void;
  onClearTeamBase: () => void;
  onPickEnemyBase: (n: number) => void;
  onClearEnemyBase: (n: number) => void;
}

/**
 * The bases panel. Same content as before — it just floats now:
 * a dark translucent panel with a deep shadow (the page keeps it pinned to the top while you scroll).
 */
export default function StatsBar({
  war,
  summary,
  slots,
  enemyScouts,
  activeSlotId,
  poolAddArmedSlotId,
  onPickTeamBase,
  onClearTeamBase,
  onPickEnemyBase,
  onClearEnemyBase,
}: StatsBarProps): React.ReactElement {
  const teamTakenBy = new Map<number, string>();
  for (const s of slots) {
    if (typeof s.teamBaseNumber === "number") teamTakenBy.set(s.teamBaseNumber, s._id);
  }

  // Build richer enemy ownership: a base can be one normal slot's single
  // target AND/OR sit in several multi-select slots' pools at once.
  const enemyOwnership = new Map<number, EnemyBaseOwnership>();
  const getOrCreate = (n: number): EnemyBaseOwnership => {
    let entry = enemyOwnership.get(n);
    if (!entry) {
      entry = { normalSlotId: null, multiSlotIds: [] };
      enemyOwnership.set(n, entry);
    }
    return entry;
  };
  for (const s of slots) {
    if (s.isMultiSelect) {
      for (const n of s.enemyBaseNumbers) getOrCreate(n).multiSlotIds.push(s._id);
    } else if (typeof s.enemyBaseNumber === "number") {
      getOrCreate(s.enemyBaseNumber).normalSlotId = s._id;
    }
  }

  const starMap = new Map<number, StarCount>();
  for (const s of enemyScouts) starMap.set(s.baseNumber, s.expectedStars);

  const activeSlot = slots.find((s) => s._id === activeSlotId) ?? null;
  // Picking a NEW enemy base is only allowed right now when the active slot
  // is a normal (single-target) slot, or a multi-select slot that's armed
  // via its "+ new" button. Bases already owned by the active slot
  // remain clickable-to-remove regardless of this flag (see BasePips).
  const enemyPickEnabled = activeSlot ? !activeSlot.isMultiSelect || poolAddArmedSlotId === activeSlot._id : false;

  return (
    <div className="rounded-xl border-2 border-line bg-black/65 p-5 shadow-[0_16px_36px_rgba(0,0,0,0.55)] ring-1 ring-black/40 backdrop-blur-md">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <h2 className="font-display text-2xl font-bold leading-tight text-white" style={OUTLINE}>
            {war.name}
          </h2>
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-dim">
            {war.mode} · {war.size} bases per side
            {war.leagueTier ? ` · ${war.leagueTier}` : ""}
          </p>
        </div>
        <p className="text-sm font-semibold" style={SOFT}>
          {activeSlot ? (
            activeSlot.isMultiSelect ? (
              poolAddArmedSlotId === activeSlot._id ? (
                <span className="text-gold">Slot #{activeSlot.index} — tap a base to add it to the pool</span>
              ) : (
                <span className="text-white">Slot #{activeSlot.index} selected — use "+ new" to add enemy targets</span>
              )
            ) : (
              <span className="text-white">Filling slot #{activeSlot.index} — tap a base below</span>
            )
          ) : (
            <span className="text-white/70">Select a slot below to start assigning</span>
          )}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-2.5 flex items-end justify-between">
            <span className="font-display text-base font-bold uppercase tracking-wide text-gold" style={OUTLINE}>
              Team bases
            </span>
            <span className="text-2xl font-extrabold text-gold" style={OUTLINE}>
              {summary.teamBasesAvailable}
              <span className="text-sm font-bold text-white/60">/{summary.teamBasesTotal} open</span>
            </span>
          </div>
          <BasePips
            total={war.size}
            tone="team"
            takenBy={teamTakenBy}
            activeSlotId={activeSlotId}
            onPick={onPickTeamBase}
            onClear={onClearTeamBase}
          />
        </div>

        <div>
          <div className="mb-2.5 flex items-end justify-between">
            <span className="font-display text-base font-bold uppercase tracking-wide text-red-400" style={OUTLINE}>
              Enemy bases
            </span>
            <span className="text-2xl font-extrabold text-red-400" style={OUTLINE}>
              {summary.enemyBasesAvailable}
              <span className="text-sm font-bold text-white/60">/{summary.enemyBasesTotal} open</span>
            </span>
          </div>
          <BasePips
            total={war.size}
            tone="enemy"
            enemyOwnership={enemyOwnership}
            activeSlotId={activeSlotId}
            onPick={onPickEnemyBase}
            onClear={onClearEnemyBase}
            starMap={starMap}
            enemyPickEnabled={enemyPickEnabled}
          />
          <p className="mt-2 text-[10px] text-white/60" style={SOFT}>
            Numbered badge = base already sits in that many other multi-select pools.
          </p>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import type { EnemyScout, Slot, StarCount, War, WarSummary } from "../types";
import BasePips, { EnemyBaseOwnership } from "./BasePips";

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
  // via its "+ Add base" button. Bases already owned by the active slot
  // remain clickable-to-remove regardless of this flag (see BasePips).
  const enemyPickEnabled = activeSlot ? !activeSlot.isMultiSelect || poolAddArmedSlotId === activeSlot._id : false;

  return (
    <div className="rounded-lg border border-base-border bg-black shadow-md p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-base-border pb-3">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wide text-ink-primary">{war.name}</h2>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
            {war.mode} · {war.size} bases per side
            {war.leagueTier ? ` · ${war.leagueTier}` : ""}
          </p>
        </div>
        <p className="font-mono text-xs text-ink-muted">
          {activeSlot ? (
            activeSlot.isMultiSelect ? (
              poolAddArmedSlotId === activeSlot._id ? (
                <span className="text-team-bright">Slot #{activeSlot.index} — tap a base to add it to the pool</span>
              ) : (
                <span className="text-ink-primary">
                  Slot #{activeSlot.index} selected — use "+ Add base" to add enemy targets
                </span>
              )
            ) : (
              <span className="text-ink-primary">Filling slot #{activeSlot.index} — tap a base below</span>
            )
          ) : (
            "Select a slot below to start assigning"
          )}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-end justify-between">
            <span className="font-display text-sm uppercase tracking-widest text-team-bright">Team Bases</span>
            <span className="font-mono text-2xl font-semibold text-team-bright">
              {summary.teamBasesAvailable}
              <span className="text-sm text-ink-faint">/{summary.teamBasesTotal} open</span>
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
          <div className="mb-2 flex items-end justify-between">
            <span className="font-display text-sm uppercase tracking-widest text-enemy-bright">Enemy Bases</span>
            <span className="font-mono text-2xl font-semibold text-enemy-bright">
              {summary.enemyBasesAvailable}
              <span className="text-sm text-ink-faint">/{summary.enemyBasesTotal} open</span>
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
          <p className="mt-1.5 font-mono text-[10px] text-ink-faint">
            Numbered badge = base already sits in that many other multi-select pools.
          </p>
        </div>
      </div>
    </div>
  );
}
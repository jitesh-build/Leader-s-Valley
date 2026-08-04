import React from "react";
import type { EnemyScout, Slot, StarCount, War, WarSummary } from "../types";
import BasePips from "./BasePips";

interface StatsBarProps {
  war: War;
  summary: WarSummary;
  slots: Slot[];
  enemyScouts: EnemyScout[];
  activeSlotId: string | null;
  onPickTeamBase: (n: number) => void;
  onClearTeamBase: () => void;
  onPickEnemyBase: (n: number) => void;
  onClearEnemyBase: () => void;
}

export default function StatsBar({
  war,
  summary,
  slots,
  enemyScouts,
  activeSlotId,
  onPickTeamBase,
  onClearTeamBase,
  onPickEnemyBase,
  onClearEnemyBase,
}: StatsBarProps): React.ReactElement {
  const teamTakenBy = new Map<number, string>();
  const enemyTakenBy = new Map<number, string>();
  for (const s of slots) {
    if (typeof s.teamBaseNumber === "number") teamTakenBy.set(s.teamBaseNumber, s._id);
    if (typeof s.enemyBaseNumber === "number") enemyTakenBy.set(s.enemyBaseNumber, s._id);
  }
  const starMap = new Map<number, StarCount>();
  for (const s of enemyScouts) starMap.set(s.baseNumber, s.expectedStars);

  const activeSlot = slots.find((s) => s._id === activeSlotId) ?? null;

  return (
    <div className="rounded-lg border border-base-border bg-base-panel/80 p-5">
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
            <span className="text-ink-primary">Filling slot #{activeSlot.index} — tap a base below</span>
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
            takenBy={teamTakenBy}
            tone="team"
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
            takenBy={enemyTakenBy}
            tone="enemy"
            activeSlotId={activeSlotId}
            onPick={onPickEnemyBase}
            onClear={onClearEnemyBase}
            starMap={starMap}
          />
        </div>
      </div>
    </div>
  );
}

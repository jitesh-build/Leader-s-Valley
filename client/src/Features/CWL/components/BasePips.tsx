

import React from "react";
import type { StarCount } from "../types";
import { STAR_TIER_CLASSES } from "../lib/starTiers";

/** Per-base ownership info for the enemy grid, where a base can belong to
 *  one normal (single-target) slot AND/OR several multi-select pools. */
export interface EnemyBaseOwnership {
  normalSlotId: string | null;
  multiSlotIds: string[];
}

interface BasePipsProps {
  total: number;
  tone: "team" | "enemy";
  activeSlotId: string | null;
  onPick: (n: number) => void;
  /** Clears/removes base `n` from whatever currently owns it for the active slot. */
  onClear: (n: number) => void;

  // --- team tone -----------------------------------------------------------
  /** team tone only: base number -> id of whichever slot currently holds it */
  takenBy?: ReadonlyMap<number, string>;

  // --- enemy tone ------------------------------------------------------------
  /** enemy tone only: richer ownership since multi-select pools can share bases */
  enemyOwnership?: ReadonlyMap<number, EnemyBaseOwnership>;
  /** enemy tone only: enemy base number -> scouted star tier, for the corner indicator */
  starMap?: ReadonlyMap<number, StarCount>;
  /** enemy tone only: whether picking an unowned base right now is allowed.
   *  True whenever the active slot is a normal slot (always pickable while
   *  empty), or a multi-select slot that's currently "armed" to add a base. */
  enemyPickEnabled?: boolean;
}

const TONE_CLASSES: Record<BasePipsProps["tone"], { lit: string; ring: string; outline: string }> = {
  team: {
    lit: "bg-gradient-to-b from-gold-soft to-gold border-black/60 text-[#1a1405]",
    ring: "ring-2 ring-white ring-offset-2 ring-offset-black",
    outline: "border-gold/40 text-gold/80 hover:border-gold hover:text-gold",
  },
  enemy: {
    lit: "bg-gradient-to-b from-red-400 to-red-600 border-black/60 text-white",
    ring: "ring-2 ring-white ring-offset-2 ring-offset-black",
    outline: "border-red-400/40 text-red-300/80 hover:border-red-300 hover:text-red-200",
  },
};

function BasePips({
  total,
  tone,
  activeSlotId,
  onPick,
  onClear,
  takenBy,
  enemyOwnership,
  starMap,
  enemyPickEnabled = true,
}: BasePipsProps): React.ReactElement {
  const tones = TONE_CLASSES[tone];
  const numbers = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label={`${tone} base slots`}>
      {numbers.map((n) => {
        const star = starMap?.get(n);

        let isActiveOwned: boolean;
        let isTakenByOther: boolean;
        let clickable: boolean;
        let sharedCount = 0;
        let title: string;

        if (tone === "team") {
          const holderId = takenBy?.get(n);
          isActiveOwned = activeSlotId !== null && holderId === activeSlotId;
          isTakenByOther = holderId !== undefined && !isActiveOwned;
          const isAvailable = holderId === undefined;
          clickable = activeSlotId !== null && (isAvailable || isActiveOwned);
          title = isTakenByOther
            ? `Base #${n} — already assigned elsewhere`
            : isActiveOwned
              ? `Base #${n} — assigned to this slot (click to clear)`
              : activeSlotId
                ? `Base #${n} — assign to selected slot`
                : `Base #${n} — select a slot first`;
        } else {
          const ownership = enemyOwnership?.get(n) ?? { normalSlotId: null, multiSlotIds: [] };
          const ownedByActiveNormal = activeSlotId !== null && ownership.normalSlotId === activeSlotId;
          const ownedByActiveMulti = activeSlotId !== null && ownership.multiSlotIds.includes(activeSlotId);
          isActiveOwned = ownedByActiveNormal || ownedByActiveMulti;
          isTakenByOther = ownership.normalSlotId !== null && ownership.normalSlotId !== activeSlotId;
          sharedCount = ownership.multiSlotIds.length;

          clickable = activeSlotId !== null && (isActiveOwned || (!isTakenByOther && enemyPickEnabled));

          title = isActiveOwned
            ? `Base #${n} — assigned here (click to remove)`
            : isTakenByOther
              ? `Base #${n} — already the single target of another slot`
              : activeSlotId === null
                ? `Base #${n} — select a slot first`
                : !enemyPickEnabled
                  ? `Base #${n} — tap "+ new" on the multi-target slot first`
                  : sharedCount > 0
                    ? `Base #${n} — already in ${sharedCount} other multi-select pool${sharedCount > 1 ? "s" : ""}, still assignable`
                    : `Base #${n} — assign to selected slot`;
        }

        let classes = `bg-black/40 border-dashed ${tones.outline}`;
        if (isActiveOwned) classes = `${tones.lit} ${tones.ring}`;
        else if (isTakenByOther) classes = "bg-black/60 border-white/10 text-white/30";
        else if (activeSlotId) classes = `bg-black/40 border-solid ${tones.outline}`;

        return (
          <button
            key={n}
            type="button"
            role="listitem"
            disabled={!clickable}
            title={title}
            onClick={() => {
              if (!clickable) return;
              if (isActiveOwned) onClear(n);
              else onPick(n);
            }}
            className={[
              "relative flex h-7 w-7 items-center justify-center rounded-md border-2 text-[11px] font-extrabold transition-colors",
              clickable ? "cursor-pointer" : "cursor-not-allowed",
              classes,
            ].join(" ")}
          >
            {n}
            {tone === "enemy" && star ? (
              <span
                className={["absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-black", STAR_TIER_CLASSES[star].dot].join(" ")}
              />
            ) : null}
            {tone === "enemy" && sharedCount > 0 && !isActiveOwned ? (
              <span className="absolute -bottom-1.5 -left-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/30 bg-black text-[8px] font-bold leading-none text-white/80">
                {sharedCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default React.memo(BasePips);
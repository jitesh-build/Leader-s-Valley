// import React from "react";
// import type { StarCount } from "../types";
// import { STAR_TIER_CLASSES } from "../lib/starTiers";

// interface BasePipsProps {
//   total: number;
//   /** base number -> id of whichever slot currently holds it */
//   takenBy: ReadonlyMap<number, string>;
//   tone: "team" | "enemy";
//   activeSlotId: string | null;
//   onPick: (n: number) => void;
//   onClear: () => void;
//   /** enemy tone only: base number -> scouted star tier, for the little corner indicator */
//   starMap?: ReadonlyMap<number, StarCount>;
// }

// const TONE_CLASSES: Record<BasePipsProps["tone"], { lit: string; ring: string; outline: string }> = {
//   team: {
//     lit: "bg-team text-base-bg border-team",
//     ring: "ring-2 ring-offset-2 ring-offset-base-panel ring-team-bright",
//     outline: "border-team-dim text-team-dim hover:border-team hover:text-team-bright",
//   },
//   enemy: {
//     lit: "bg-enemy text-base-bg border-enemy",
//     ring: "ring-2 ring-offset-2 ring-offset-base-panel ring-enemy-bright",
//     outline: "border-enemy-dim text-enemy-dim hover:border-enemy hover:text-enemy-bright",
//   },
// };

// export default function BasePips({
//   total,
//   takenBy,
//   tone,
//   activeSlotId,
//   onPick,
//   onClear,
//   starMap,
// }: BasePipsProps): React.ReactElement {
//   const tones = TONE_CLASSES[tone];
//   const numbers = Array.from({ length: total }, (_, i) => i + 1);

//   return (
//     <div className="flex flex-wrap gap-1.5" role="list" aria-label={`${tone} base slots`}>
//       {numbers.map((n) => {
//         const holderId = takenBy.get(n);
//         const isActiveOwned = activeSlotId !== null && holderId === activeSlotId;
//         const isTakenByOther = holderId !== undefined && !isActiveOwned;
//         const isAvailable = holderId === undefined;
//         const clickable = activeSlotId !== null && (isAvailable || isActiveOwned);
//         const star = starMap?.get(n);

//         let classes = "bg-base-panel2/40 " + tones.outline + " border-dashed";
//         if (isActiveOwned) classes = `${tones.lit} ${tones.ring}`;
//         else if (isTakenByOther) classes = "bg-base-panel2/70 border-base-border text-ink-faint/60";
//         else if (isAvailable && activeSlotId) classes = `bg-base-panel2/40 border-solid ${tones.outline}`;

//         return (
//           <button
//             key={n}
//             type="button"
//             role="listitem"
//             disabled={!clickable}
//             title={
//               isTakenByOther
//                 ? `Base #${n} — already assigned elsewhere`
//                 : isActiveOwned
//                   ? `Base #${n} — assigned to this slot (click to clear)`
//                   : activeSlotId
//                     ? `Base #${n} — assign to selected slot`
//                     : `Base #${n} — select a slot first`
//             }
//             onClick={() => {
//               if (!clickable) return;
//               if (isActiveOwned) onClear();
//               else onPick(n);
//             }}
//             className={[
//               "relative flex h-6 w-6 items-center justify-center rounded-[3px] border font-mono text-[10px] font-medium transition-colors",
//               clickable ? "cursor-pointer" : "cursor-not-allowed",
//               classes,
//             ].join(" ")}
//           >
//             {n}
//             {tone === "enemy" && star ? (
//               <span
//                 className={[
//                   "absolute -right-1 -top-1 h-2 w-2 rounded-full border border-base-panel",
//                   STAR_TIER_CLASSES[star].bg,
//                   STAR_TIER_CLASSES[star].border,
//                 ].join(" ")}
//               />
//             ) : null}
//           </button>
//         );
//       })}
//     </div>
//   );
// }


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
    lit: "bg-team text-base-bg border-team",
    ring: "ring-2 ring-offset-2 ring-offset-base-panel ring-team-bright",
    outline: "border-team-dim text-team-dim hover:border-team hover:text-team-bright",
  },
  enemy: {
    lit: "bg-enemy text-base-bg border-enemy",
    ring: "ring-2 ring-offset-2 ring-offset-base-panel ring-enemy-bright",
    outline: "border-enemy-dim text-enemy-dim hover:border-enemy hover:text-enemy-bright",
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
    <div className="flex flex-wrap gap-1.5" role="list" aria-label={`${tone} base slots`}>
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
                  ? `Base #${n} — tap "+ Add base" on the multi-select slot first`
                  : sharedCount > 0
                    ? `Base #${n} — already in ${sharedCount} other multi-select pool${sharedCount > 1 ? "s" : ""}, still assignable`
                    : `Base #${n} — assign to selected slot`;
        }

        let classes = "bg-base-panel2/40 " + tones.outline + " border-dashed";
        if (isActiveOwned) classes = `${tones.lit} ${tones.ring}`;
        else if (isTakenByOther) classes = "bg-base-panel2/70 border-base-border text-ink-faint/60";
        else if (sharedCount > 0 && activeSlotId) classes = `bg-base-panel2/40 border-solid ${tones.outline}`;
        else if (activeSlotId) classes = `bg-base-panel2/40 border-solid ${tones.outline}`;

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
              "relative flex h-6 w-6 items-center justify-center rounded-[3px] border font-mono text-[10px] font-medium transition-colors",
              clickable ? "cursor-pointer" : "cursor-not-allowed",
              classes,
            ].join(" ")}
          >
            {n}
            {tone === "enemy" && star ? (
              <span
                className={[
                  "absolute -right-1 -top-1 h-2 w-2 rounded-full border border-base-panel",
                  STAR_TIER_CLASSES[star].bg,
                  STAR_TIER_CLASSES[star].border,
                ].join(" ")}
              />
            ) : null}
            {tone === "enemy" && sharedCount > 0 && !isActiveOwned ? (
              <span className="absolute -bottom-1 -left-1 flex h-3 w-3 items-center justify-center rounded-full border border-base-panel bg-base-panel2 text-[7px] leading-none text-ink-faint">
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
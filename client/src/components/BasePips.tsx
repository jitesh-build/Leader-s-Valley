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

interface BasePipsProps {
  total: number;
  /** base number -> id of whichever slot currently holds it */
  takenBy: ReadonlyMap<number, string>;
  tone: "team" | "enemy";
  activeSlotId: string | null;
  onPick: (n: number) => void;
  onClear: () => void;
  /** enemy tone only: base number -> scouted star tier, for the little corner indicator */
  starMap?: ReadonlyMap<number, StarCount>;
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
  takenBy,
  tone,
  activeSlotId,
  onPick,
  onClear,
  starMap,
}: BasePipsProps): React.ReactElement {
  const tones = TONE_CLASSES[tone];
  const numbers = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label={`${tone} base slots`}>
      {numbers.map((n) => {
        const holderId = takenBy.get(n);
        const isActiveOwned = activeSlotId !== null && holderId === activeSlotId;
        const isTakenByOther = holderId !== undefined && !isActiveOwned;
        const isAvailable = holderId === undefined;
        const clickable = activeSlotId !== null && (isAvailable || isActiveOwned);
        const star = starMap?.get(n);

        let classes = "bg-base-panel2/40 " + tones.outline + " border-dashed";
        if (isActiveOwned) classes = `${tones.lit} ${tones.ring}`;
        else if (isTakenByOther) classes = "bg-base-panel2/70 border-base-border text-ink-faint/60";
        else if (isAvailable && activeSlotId) classes = `bg-base-panel2/40 border-solid ${tones.outline}`;

        return (
          <button
            key={n}
            type="button"
            role="listitem"
            disabled={!clickable}
            title={
              isTakenByOther
                ? `Base #${n} — already assigned elsewhere`
                : isActiveOwned
                  ? `Base #${n} — assigned to this slot (click to clear)`
                  : activeSlotId
                    ? `Base #${n} — assign to selected slot`
                    : `Base #${n} — select a slot first`
            }
            onClick={() => {
              if (!clickable) return;
              if (isActiveOwned) onClear();
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
          </button>
        );
      })}
    </div>
  );
}

export default React.memo(BasePips);
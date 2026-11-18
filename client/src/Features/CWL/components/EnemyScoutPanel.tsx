// import React, { useMemo } from "react";
// import type { EnemyScout, StarCount } from "../types";
// import { STAR_COUNTS, STAR_TIER_CLASSES } from "../lib/starTiers";

// interface EnemyScoutPanelProps {
//   size: number;
//   enemyScouts: EnemyScout[];
//   onSetStars: (baseNumber: number, stars: StarCount) => void;
// }

// export default function EnemyScoutPanel({ size, enemyScouts, onSetStars }: EnemyScoutPanelProps): React.ReactElement {
//   const starByBase = useMemo(() => {
//     const m = new Map<number, StarCount>();
//     for (const s of enemyScouts) m.set(s.baseNumber, s.expectedStars);
//     return m;
//   }, [enemyScouts]);

//   const groups = useMemo(() => {
//     const g: Record<StarCount, number[]> = { 3: [], 2: [], 1: [] };
//     for (let n = 1; n <= size; n++) {
//       const stars = starByBase.get(n) ?? 3;
//       g[stars].push(n);
//     }
//     return g;
//   }, [size, starByBase]);

//   return (
//     <div className="rounded-lg border border-base-border bg-base-panel/80">
//       <div className="border-b border-base-border px-4 py-3">
//         <h3 className="font-display text-sm uppercase tracking-widest text-ink-muted">
//           Enemy Base Scouting
//           <span className="ml-2 font-mono text-xs normal-case text-ink-faint">
//             set the max stars realistically available on each base — default 3
//           </span>
//         </h3>
//       </div>

//       <div className="grid grid-cols-5 gap-2 p-4 sm:grid-cols-8 lg:grid-cols-10">
//         {Array.from({ length: size }, (_, i) => i + 1).map((n) => {
//           const stars = starByBase.get(n) ?? 3;
//           return (
//             <div key={n} className="rounded border border-base-border bg-base-panel2/40 p-1.5 text-center">
//               <div className="mb-1 font-mono text-[11px] text-ink-faint">#{n}</div>
//               <div className="flex justify-center gap-0.5">
//                 {STAR_COUNTS.map((s) => {
//                   const selected = stars === s;
//                   const tier = STAR_TIER_CLASSES[s];
//                   return (
//                     <button
//                       key={s}
//                       type="button"
//                       title={`${s} star${s > 1 ? "s" : ""} max on base #${n}`}
//                       onClick={() => onSetStars(n, s)}
//                       className={[
//                         "h-5 w-5 rounded-sm border text-[9px] font-mono transition",
//                         selected ? `${tier.bg} ${tier.border} ${tier.text}` : "border-base-border text-ink-faint/70 hover:border-borderLight",
//                       ].join(" ")}
//                     >
//                       {s}
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       <div className="grid gap-3 border-t border-base-border p-4 sm:grid-cols-3">
//         {STAR_COUNTS.map((s) => {
//           const tier = STAR_TIER_CLASSES[s];
//           return (
//             <div key={s} className={["rounded border p-3", tier.border, tier.bg].join(" ")}>
//               <p className={["mb-1.5 font-display text-xs uppercase tracking-widest", tier.text].join(" ")}>
//                 {s} star{s > 1 ? "s" : ""} max · {groups[s].length} base{groups[s].length === 1 ? "" : "s"}
//               </p>
//               <p className="font-mono text-sm text-ink-primary">
//                 {groups[s].length > 0 ? groups[s].map((n) => `#${n}`).join(", ") : "—"}
//               </p>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }


import React, { useMemo } from "react";
import { Star, X } from "lucide-react";
import type { EnemyScout, StarCount } from "../types";
import { STAR_COUNTS, STAR_TIER_CLASSES } from "../lib/starTiers";
import { OUTLINE, SOFT } from "../lib/outline";

interface EnemyScoutPanelProps {
  size: number;
  enemyScouts: EnemyScout[];
  onSetStars: (baseNumber: number, stars: StarCount) => void;
  onClose: () => void;
}

/**
 * Enemy base scouting as a right-hand sidebar. The page shows/hides it with the toggle button
 * pinned to the right edge; this component is just the panel itself.
 */
export default function EnemyScoutPanel({ size, enemyScouts, onSetStars, onClose }: EnemyScoutPanelProps): React.ReactElement {
  const starByBase = useMemo(() => {
    const m = new Map<number, StarCount>();
    for (const s of enemyScouts) m.set(s.baseNumber, s.expectedStars);
    return m;
  }, [enemyScouts]);

  const groups = useMemo(() => {
    const g: Record<StarCount, number[]> = { 3: [], 2: [], 1: [] };
    for (let n = 1; n <= size; n++) {
      const stars = starByBase.get(n) ?? 3;
      g[stars].push(n);
    }
    return g;
  }, [size, starByBase]);

  return (
    <aside
      aria-label="Enemy base scouting"
      className="flex max-h-[80vh] w-[min(340px,calc(100vw-7rem))] flex-col rounded-xl border-2 border-red-900/70 bg-black/65 shadow-2xl backdrop-blur-md"
    >
      <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
        <div className="min-w-0">
          <div className="text-[10px] font-bold tracking-[0.14em] text-red-300/80">ENEMY INTEL</div>
          <h2 className="font-display text-2xl font-bold leading-tight text-white" style={OUTLINE}>
            Base scouting
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close enemy scouting"
          className="rounded-md p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
      </header>

      <div data-panel-body className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        <p className="mb-3 text-xs text-white/70" style={SOFT}>
          Set the max stars realistically available on each base — default 3.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: size }, (_, i) => i + 1).map((n) => {
            const stars = starByBase.get(n) ?? 3;
            return (
              <div key={n} className="rounded-lg border border-white/10 bg-black/40 p-2 text-center">
                <div className="mb-1.5 text-xs font-extrabold text-red-300" style={OUTLINE}>
                  #{n}
                </div>
                <div className="flex justify-center gap-1">
                  {STAR_COUNTS.map((s) => {
                    const selected = stars === s;
                    const tier = STAR_TIER_CLASSES[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={selected}
                        title={`${s} star${s > 1 ? "s" : ""} max on base #${n}`}
                        onClick={() => onSetStars(n, s)}
                        className={[
                          "h-6 w-6 rounded-md border-2 text-[11px] font-extrabold transition",
                          selected ? `${tier.bg} ${tier.border} ${tier.text}` : "border-white/15 text-white/50 hover:border-white/50 hover:text-white",
                        ].join(" ")}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          {STAR_COUNTS.map((s) => {
            const tier = STAR_TIER_CLASSES[s];
            return (
              <div key={s} className={["rounded-lg border-2 p-3", tier.border, tier.bg].join(" ")}>
                <p className={["flex items-center gap-1 text-[11px] font-bold tracking-[0.12em]", tier.text].join(" ")}>
                  {s}
                  <Star size={11} className="fill-current" />
                  MAX · {groups[s].length} BASE{groups[s].length === 1 ? "" : "S"}
                </p>
                <p className="mt-1 text-sm font-bold text-white" style={SOFT}>
                  {groups[s].length > 0 ? groups[s].map((n) => `#${n}`).join(", ") : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
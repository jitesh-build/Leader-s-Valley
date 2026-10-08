import React, { useMemo } from "react";
import type { EnemyScout, StarCount } from "../types";
import { STAR_COUNTS, STAR_TIER_CLASSES } from "../lib/starTiers";

interface EnemyScoutPanelProps {
  size: number;
  enemyScouts: EnemyScout[];
  onSetStars: (baseNumber: number, stars: StarCount) => void;
}

export default function EnemyScoutPanel({ size, enemyScouts, onSetStars }: EnemyScoutPanelProps): React.ReactElement {
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
    <div className="rounded-lg border border-base-border bg-base-panel/80">
      <div className="border-b border-base-border px-4 py-3">
        <h3 className="font-display text-sm uppercase tracking-widest text-ink-muted">
          Enemy Base Scouting
          <span className="ml-2 font-mono text-xs normal-case text-ink-faint">
            set the max stars realistically available on each base — default 3
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-5 gap-2 p-4 sm:grid-cols-8 lg:grid-cols-10">
        {Array.from({ length: size }, (_, i) => i + 1).map((n) => {
          const stars = starByBase.get(n) ?? 3;
          return (
            <div key={n} className="rounded border border-base-border bg-base-panel2/40 p-1.5 text-center">
              <div className="mb-1 font-mono text-[11px] text-ink-faint">#{n}</div>
              <div className="flex justify-center gap-0.5">
                {STAR_COUNTS.map((s) => {
                  const selected = stars === s;
                  const tier = STAR_TIER_CLASSES[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      title={`${s} star${s > 1 ? "s" : ""} max on base #${n}`}
                      onClick={() => onSetStars(n, s)}
                      className={[
                        "h-5 w-5 rounded-sm border text-[9px] font-mono transition",
                        selected ? `${tier.bg} ${tier.border} ${tier.text}` : "border-base-border text-ink-faint/70 hover:border-borderLight",
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

      <div className="grid gap-3 border-t border-base-border p-4 sm:grid-cols-3">
        {STAR_COUNTS.map((s) => {
          const tier = STAR_TIER_CLASSES[s];
          return (
            <div key={s} className={["rounded border p-3", tier.border, tier.bg].join(" ")}>
              <p className={["mb-1.5 font-display text-xs uppercase tracking-widest", tier.text].join(" ")}>
                {s} star{s > 1 ? "s" : ""} max · {groups[s].length} base{groups[s].length === 1 ? "" : "s"}
              </p>
              <p className="font-mono text-sm text-ink-primary">
                {groups[s].length > 0 ? groups[s].map((n) => `#${n}`).join(", ") : "—"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

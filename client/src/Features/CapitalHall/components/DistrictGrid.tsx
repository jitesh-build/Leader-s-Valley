import { Check } from "lucide-react";
import { formatNumber } from "../../Members/format";
import type { District } from "../types";

interface Props {
  districts: District[];
  focusId: number | null;
  onSelect: (id: number) => void;
}

export default function DistrictGrid({ districts, focusId, onSelect }: Props) {
  const totalLevels = districts.reduce((s, d) => s + d.level, 0);
  const totalMax = districts.reduce((s, d) => s + d.maxLevel, 0);
  const pct = Math.round((totalLevels / totalMax) * 100);

  return (
    <section className="rounded-xl border border-line bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">YOUR CAPITAL</div>
          <h2 className="mt-2 font-display text-[26px] font-bold text-white">Districts</h2>
        </div>
        <div className="w-56">
          <div className="flex justify-between text-[11px] text-muted">
            <span>Overall upgrade</span>
            <span className="font-semibold text-white">
              {totalLevels}/{totalMax} levels · {pct}%
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">Click a district to make it your upgrade focus.</p>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {districts.map((d) => {
          const maxed = d.level >= d.maxLevel;
          const focused = focusId === d.id;
          return (
            <button
              key={d.id}
              type="button"
              disabled={maxed}
              aria-pressed={focused}
              onClick={() => onSelect(d.id)}
              className={`rounded-xl border p-4 text-left transition ${
                focused ? "border-gold/60 bg-gold/5" : maxed ? "cursor-default border-line bg-panel" : "border-line bg-panel hover:border-gold/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-lg font-bold leading-tight text-white">{d.name}</div>
                  <div className="text-[11px] text-muted">{d.id === 1 ? "Capital Hall" : "District Hall"}</div>
                </div>
                <span className="shrink-0 rounded bg-gold/10 px-2 py-0.5 text-[11px] font-bold text-gold">
                  Lv {d.level}/{d.maxLevel}
                </span>
              </div>

              <div className="mt-3 flex gap-0.5" aria-hidden="true">
                {Array.from({ length: d.maxLevel }, (_, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i < d.level ? "bg-gold" : "bg-white/10"}`} />
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                {maxed ? (
                  <span className="flex items-center gap-1 font-semibold text-gold">
                    <Check size={13} /> Maxed
                  </span>
                ) : (
                  <span className="text-muted2">
                    Next: <span className="font-semibold text-white">{d.nextCost ? formatNumber(d.nextCost) : "—"}</span> gold
                  </span>
                )}
                {focused && <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-gold">UPGRADE FOCUS</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
import { PartyPopper } from "lucide-react";
import { formatNumber } from "../../Members/format";
import { costKey } from "../hooks/useUpgradeFocus";
import type { District, UpgradeFocus } from "../types";

interface Props {
  districts: District[];
  /** The district being saved for (the saved choice, or the first one that can still be upgraded). */
  target: District | null;
  focus: UpgradeFocus;
  onChange: (patch: { districtId?: number | null; treasury?: number }) => void;
  onCost: (districtId: number, level: number, cost: number) => void;
  /** Average capital gold looted per finished raid weekend. */
  avgWeeklyLoot: number;
}

const fieldClass = "h-[42px] w-full rounded-lg border border-line bg-panel px-3 text-sm text-white placeholder:text-muted focus:border-gold/50 focus:outline-none";
const labelClass = "mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-muted";

export default function UpgradeFocusPanel({ districts, target, focus, onChange, onCost, avgWeeklyLoot }: Props) {
  const upgradable = districts.filter((d) => d.level < d.maxLevel);
  const cost = target ? (focus.costs[costKey(target.id, target.level)] ?? 0) : 0;

  return (
    <section aria-label="Upgrade focus" className="rounded-xl border border-line bg-card p-6">
      <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">SAVING UP</div>
      <h2 className="mt-2 font-display text-[26px] font-bold text-white">Upgrade focus</h2>

      {!target ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-panel p-4 text-sm text-gold">
          <PartyPopper size={22} className="shrink-0" />
          Every district is maxed. Nothing left to save for.
        </div>
      ) : (
        <>
          <label className="mt-5 block">
            <span className={labelClass}>DISTRICT</span>
            <select value={target.id} onChange={(e) => onChange({ districtId: Number(e.target.value) })} className={fieldClass}>
              {upgradable.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — Lv {d.level} → {d.level + 1}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>GOLD IN TREASURY</span>
              <input
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                value={focus.treasury === 0 ? "" : focus.treasury}
                placeholder="0"
                onChange={(e) => onChange({ treasury: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)) })}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>COST OF NEXT UPGRADE</span>
              <input
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                value={cost === 0 ? "" : cost}
                placeholder="e.g. 180000"
                onChange={(e) => onCost(target.id, target.level, e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                className={fieldClass}
              />
            </label>
          </div>
          <p className="mt-1.5 text-[11px] text-muted">The game doesn't share these two — type what the in-game capital and upgrade screens show.</p>

          {cost === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-line p-4 text-xs text-muted2">
              Enter the upgrade cost for <span className="font-semibold text-white">{target.name}</span> to see how close you are.
            </div>
          ) : (
            (() => {
              const pct = Math.min(100, (focus.treasury / cost) * 100);
              const remaining = Math.max(0, cost - focus.treasury);
              const weekends = avgWeeklyLoot > 0 ? Math.ceil(remaining / avgWeeklyLoot) : null;
              return (
                <div className="mt-5 rounded-xl bg-panel p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-2xl font-bold text-white">
                      {formatNumber(focus.treasury)}
                      <span className="text-sm font-normal text-muted"> / {formatNumber(cost)}</span>
                    </span>
                    <span className="text-sm font-semibold text-gold">{Math.round(pct)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${pct >= 100 ? "bg-green-400" : "bg-gold"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-3 text-xs text-muted2">
                    {remaining === 0 ? (
                      <span className="font-semibold text-green-400">Enough gold — go upgrade {target.name}!</span>
                    ) : (
                      <>
                        {formatNumber(remaining)} gold to go
                        {weekends !== null && ` · about ${weekends} raid weekend${weekends === 1 ? "" : "s"} at the recent loot pace`}
                      </>
                    )}
                  </p>
                </div>
              );
            })()
          )}
        </>
      )}
    </section>
  );
}
import { formatNumber } from "../../Members/format";
import type { District, UpgradeFocus } from "../types";

interface Props {
  districts: District[];
  focus: UpgradeFocus;
  onChange: (patch: Partial<UpgradeFocus>) => void;
  /** Average capital gold looted per raid weekend recently. */
  avgWeeklyLoot: number;
}

export default function UpgradeFocusPanel({ districts, focus, onChange, avgWeeklyLoot }: Props) {
  const upgradable = districts.filter((d) => d.level < d.maxLevel && d.nextCost);
  const target = upgradable.find((d) => d.id === focus.districtId) ?? upgradable[0] ?? null;

  return (
    <section className="rounded-xl border border-line bg-card p-6">
      <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">SAVING UP</div>
      <h2 className="mt-2 font-display text-[26px] font-bold text-white">Upgrade focus</h2>

      {!target ? (
        <p className="mt-5 rounded-xl bg-panel p-4 text-sm text-gold">Every district is maxed. Nothing left to save for.</p>
      ) : (
        (() => {
          const cost = target.nextCost ?? 0;
          const pct = cost ? Math.min(100, (focus.treasury / cost) * 100) : 100;
          const remaining = Math.max(0, cost - focus.treasury);
          const weekends = avgWeeklyLoot > 0 ? Math.ceil(remaining / avgWeeklyLoot) : null;
          return (
            <>
              <label className="mt-5 block">
                <span className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-muted">DISTRICT</span>
                <select
                  value={target.id}
                  onChange={(e) => onChange({ districtId: Number(e.target.value) })}
                  className="h-[42px] w-full rounded-lg border border-line bg-panel px-3 text-sm text-white focus:border-gold/50 focus:outline-none"
                >
                  {upgradable.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — Lv {d.level} → {d.level + 1}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-muted">CAPITAL GOLD IN TREASURY</span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={focus.treasury}
                  onChange={(e) => onChange({ treasury: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)) })}
                  className="h-[42px] w-full rounded-lg border border-line bg-panel px-3 text-sm text-white focus:border-gold/50 focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-muted">The API doesn't expose this — type in what the in-game capital screen shows.</span>
              </label>

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
            </>
          );
        })()
      )}
    </section>
  );
}
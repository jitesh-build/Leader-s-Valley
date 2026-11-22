import { Check, Crown, Target } from "lucide-react";
import type { District } from "../types";

interface Props {
  districts: District[];
  /** The district currently chosen as the upgrade focus. */
  focusId: number | null;
  onSelect: (id: number) => void;
}

function Pips({ level, max }: { level: number; max: number }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < level ? "bg-gradient-to-r from-gold-dim to-gold" : "bg-white/10"}`} />
      ))}
    </div>
  );
}

function DistrictCard({ d, focused, onSelect }: { d: District; focused: boolean; onSelect: (id: number) => void }) {
  const maxed = d.level >= d.maxLevel;
  return (
    <button
      type="button"
      disabled={maxed}
      aria-pressed={focused}
      aria-label={`${d.name}, level ${d.level} of ${d.maxLevel}${maxed ? ", maxed" : ""}`}
      onClick={() => onSelect(d.id)}
      className={`group w-full rounded-xl border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
        d.isHall ? "p-5" : "p-4"
      } ${d.isHall && !focused ? "bg-gradient-to-br from-gold/[0.07] to-transparent" : ""} ${
        focused
          ? "border-gold/70 bg-gold/[0.07] shadow-[0_0_20px_rgba(217,169,63,0.1)]"
          : maxed
            ? "cursor-default border-line bg-panel"
            : "border-line bg-panel hover:border-gold/40 hover:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {d.isHall && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <Crown size={22} />
            </span>
          )}
          <div className="min-w-0">
            <div className={`truncate font-display font-bold leading-tight text-white ${d.isHall ? "text-2xl" : "text-lg"}`}>{d.name}</div>
            <div className="text-[11px] text-muted">{d.isHall ? "Capital Hall" : "District Hall"}</div>
          </div>
        </div>
        <span className="shrink-0 rounded-lg bg-gold/10 px-2.5 py-1 font-display text-sm font-bold text-gold">
          Lv {d.level}
          <span className="text-gold/60">/{d.maxLevel}</span>
        </span>
      </div>

      <div className={d.isHall ? "mt-4" : "mt-3"}>
        <Pips level={d.level} max={d.maxLevel} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {maxed ? (
          <span className="flex items-center gap-1 font-semibold text-gold">
            <Check size={13} /> Maxed
          </span>
        ) : (
          <span className="text-muted2">
            Next: <span className="font-semibold text-white">Lv {d.level + 1}</span>
          </span>
        )}
        {focused && (
          <span className="flex items-center gap-1 rounded bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-gold">
            <Target size={10} /> UPGRADE FOCUS
          </span>
        )}
      </div>
    </button>
  );
}

export default function DistrictGrid({ districts, focusId, onSelect }: Props) {
  const totalLevels = districts.reduce((s, d) => s + d.level, 0);
  const totalMax = districts.reduce((s, d) => s + d.maxLevel, 0);
  const pct = totalMax > 0 ? Math.round((totalLevels / totalMax) * 100) : 0;
  const maxedCount = districts.filter((d) => d.level >= d.maxLevel).length;
  const hall = districts.find((d) => d.isHall);
  const others = districts.filter((d) => !d.isHall);

  return (
    <section aria-label="Districts" className="rounded-xl border border-line bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">YOUR CAPITAL</div>
          <h2 className="mt-2 font-display text-[26px] font-bold text-white">Districts</h2>
        </div>
        <div className="w-full sm:w-64">
          <div className="flex justify-between text-[11px] text-muted">
            <span>Overall upgrade</span>
            <span className="font-semibold text-white">
              {totalLevels}/{totalMax} levels · {pct}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 text-[11px] text-muted">
            {totalMax - totalLevels} levels to go · {maxedCount}/{districts.length} maxed
          </div>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">Click a district to make it your upgrade focus. More districts appear as your Capital Hall levels up.</p>

      <div className="mt-5 space-y-3">
        {hall && <DistrictCard d={hall} focused={focusId === hall.id} onSelect={onSelect} />}
        {others.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {others.map((d) => (
              <DistrictCard key={d.id} d={d} focused={focusId === d.id} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
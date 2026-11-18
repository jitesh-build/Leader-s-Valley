import { formatNumber } from "../../Members/format";
import type { RaidHistoryItem } from "../types";

interface Props {
  history: RaidHistoryItem[];
  /** The weekend happening now (loot so far). */
  current: { totalLoot: number; medals: number };
}

export default function RaidHistoryPanel({ history, current }: Props) {
  const bars = [...history.map((h) => ({ ...h, live: false })), { label: "Now", totalLoot: current.totalLoot, medals: current.medals, live: true }];
  const max = Math.max(...bars.map((b) => b.totalLoot), 1);
  const finished = history.length ? Math.round(history.reduce((s, h) => s + h.totalLoot, 0) / history.length) : 0;

  return (
    <section className="rounded-xl border border-line bg-card p-6">
      <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">TREND</div>
      <h2 className="mt-2 font-display text-[26px] font-bold text-white">Raid history</h2>
      <p className="mt-1 text-xs text-muted">Capital gold looted per weekend · average of finished weekends: {formatNumber(finished)}</p>

      <div className="mt-6 flex h-48 items-end gap-3">
        {bars.map((b) => (
          <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2" title={`${b.label}: ${formatNumber(b.totalLoot)} gold · ${formatNumber(b.medals)} medals`}>
            <span className="text-[10px] font-semibold text-muted2">{formatNumber(b.totalLoot)}</span>
            <div className="flex w-full flex-1 items-end">
              <div
                className={`w-full rounded-t-md ${b.live ? "bg-gold" : "bg-gold/40"}`}
                style={{ height: `${Math.max(4, (b.totalLoot / max) * 100)}%` }}
              />
            </div>
            <span className={`text-[10px] ${b.live ? "font-bold text-gold" : "text-muted"}`}>{b.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
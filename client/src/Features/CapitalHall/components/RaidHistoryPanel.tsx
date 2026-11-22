import { formatNumber } from "../../Members/format";
import type { RaidHistoryItem } from "../types";

interface Props {
  /** Earlier weekends, oldest first. */
  history: RaidHistoryItem[];
  /** The newest weekend (loot so far, or the final result). */
  current: { totalLoot: number; medals: number; live: boolean } | null;
}

export default function RaidHistoryPanel({ history, current }: Props) {
  const bars = [
    ...history.map((h) => ({ ...h, live: false, latest: false })),
    ...(current ? [{ label: current.live ? "Now" : "Latest", totalLoot: current.totalLoot, medals: current.medals, live: current.live, latest: true }] : []),
  ];
  const max = Math.max(...bars.map((b) => b.totalLoot), 1);
  const avg = history.length ? Math.round(history.reduce((s, h) => s + h.totalLoot, 0) / history.length) : 0;

  // How the newest weekend compares with the earlier ones (a live weekend is still partial, so it is labelled "so far").
  const delta = current && avg > 0 ? Math.round(((current.totalLoot - avg) / avg) * 100) : null;

  return (
    <section aria-label="Raid history" className="rounded-xl border border-line bg-card p-6">
      <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">TREND</div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-[26px] font-bold text-white">Raid history</h2>
        {delta !== null && (
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${delta >= 0 ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs average{current?.live ? " so far" : ""}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">
        Capital gold looted per weekend
        {history.length > 0 ? ` · average of the earlier weekends: ${formatNumber(avg)}` : ""}
      </p>

      {bars.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">No raid weekends yet.</p>
      ) : (
        <div className="mt-6 flex h-48 items-end gap-3">
          {bars.map((b, i) => (
            <div key={`${b.label}-${i}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2" title={`${b.label}: ${formatNumber(b.totalLoot)} gold · ${formatNumber(b.medals)} medals`}>
              <span className="text-[10px] font-semibold text-muted2">{formatNumber(b.totalLoot)}</span>
              <div className="flex w-full flex-1 items-end">
                <div className={`w-full rounded-t-md ${b.latest ? "bg-gold" : "bg-gold/40"}`} style={{ height: `${Math.max(4, (b.totalLoot / max) * 100)}%` }} />
              </div>
              <span className={`text-[10px] ${b.latest ? "font-bold text-gold" : "text-muted"}`}>{b.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
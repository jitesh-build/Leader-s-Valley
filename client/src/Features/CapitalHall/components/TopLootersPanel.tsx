import { useMemo, useState } from "react";
import { formatNumber } from "../../Members/format";
import type { Member } from "../../Members/types";

type Mode = "weekend" | "total";

export default function TopLootersPanel({ members }: { members: Member[] }) {
  const [mode, setMode] = useState<Mode>("weekend");

  const rows = useMemo(() => {
    const value = (m: Member): number => (mode === "weekend" ? (m.capital.raid?.looted ?? 0) : m.capital.lootedTracked);
    return [...members]
      .sort((a, b) => value(b) - value(a))
      .slice(0, 8)
      .map((m) => ({ m, value: value(m) }));
  }, [members, mode]);

  const top = rows[0]?.value || 1;
  const weekends = members[0]?.capital.weekendsTracked ?? 0;

  return (
    <section className="rounded-xl border border-line bg-card p-6">
      <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">LEADERBOARD</div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-[26px] font-bold text-white">Top raiders</h2>
        <div className="flex overflow-hidden rounded-lg border border-line text-[11px] font-semibold" role="group" aria-label="Leaderboard type">
          {(
            [
              ["weekend", "This weekend"],
              ["total", `Last ${weekends || 0} weekends`],
            ] as const
          ).map(([id, label], i) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
              className={`px-3 py-1.5 transition ${i > 0 ? "border-l border-line" : ""} ${mode === id ? "bg-gold/15 text-gold" : "text-muted2 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">{mode === "weekend" ? "Capital gold looted in the latest raid weekend." : `Capital gold looted over the last ${weekends} raid weekends.`}</p>

      <ol className="mt-5 space-y-3">
        {rows.map(({ m, value }, i) => (
          <li key={m.tag} className="text-xs">
            <div className="flex items-center gap-3">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded font-display text-sm font-bold ${i < 3 ? "bg-gold/15 text-gold" : "bg-white/5 text-muted2"}`}>{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-white">{m.name}</span>
              <span className="shrink-0 font-semibold text-white">{formatNumber(value)}</span>
            </div>
            <div className="ml-9 mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gold" style={{ width: `${(value / top) * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
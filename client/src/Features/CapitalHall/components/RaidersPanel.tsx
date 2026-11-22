import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { useLayoutContext } from "../../Layout/useLayoutContext";
import { formatNumber } from "../../Members/format";
import { fillTemplate, useSettings } from "../../Settings/settingsStore";
import type { RaidWeekend, Raider } from "../types";

interface Props {
  raiders: Raider[];
  noActivity: { tag: string; name: string }[];
  weekend: RaidWeekend | null;
  /** How many weekends the "total" tab adds up. */
  weekendsTracked: number;
}

type Tab = "todo" | "weekend" | "total";

function Pips({ used, total }: { used: number; total: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${used} of ${total} raid attacks used`}>
      {Array.from({ length: Math.min(total, 8) }, (_, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < used ? "bg-gold" : "bg-white/20"}`} />
      ))}
    </span>
  );
}

export default function RaidersPanel({ raiders, noActivity, weekend, weekendsTracked }: Props) {
  const [tab, setTab] = useState<Tab>("todo");
  const { showToast } = useLayoutContext();
  const [settings] = useSettings();
  const live = weekend?.state === "ongoing";

  // people who still have raid attacks left (live) / left some unused (ended)
  const pending = useMemo(
    () =>
      raiders
        .filter((r) => r.inLatest && r.attacks < r.attackLimit)
        .map((r) => ({ r, left: r.attackLimit - r.attacks }))
        .sort((a, b) => b.left - a.left || a.r.name.localeCompare(b.r.name)),
    [raiders]
  );
  const todoCount = pending.length + noActivity.length;

  const board = useMemo(() => {
    const value = (r: Raider): number => (tab === "weekend" ? r.looted : r.lootedTotal);
    const rows = [...raiders].sort((a, b) => value(b) - value(a) || a.name.localeCompare(b.name)).slice(0, 10);
    return { rows, value, top: rows[0] ? value(rows[0]) || 1 : 1 };
  }, [raiders, tab]);

  async function copyReminder() {
    const names = [...pending.map((p) => `${p.r.name} (${p.left})`), ...noActivity.map((n) => n.name)];
    const text = fillTemplate(settings.raidReminderTemplate, { players: names.join(", "), clan: settings.clanName });
    try {
      await navigator.clipboard.writeText(text);
      showToast("Reminder copied — paste it in clan chat");
    } catch {
      showToast("Couldn't copy to the clipboard");
    }
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "todo", label: live ? "Still to attack" : "Missed attacks", badge: todoCount },
    { id: "weekend", label: "This weekend" },
    { id: "total", label: `Last ${weekendsTracked || 0} weekends` },
  ];

  return (
    <section aria-label="Raiders" className="rounded-xl border border-line bg-card p-6">
      <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">THE RAIDERS</div>
      <h2 className="mt-2 font-display text-[26px] font-bold text-white">Who's pulling their weight</h2>

      <div role="tablist" aria-label="Raiders view" className="mt-4 flex gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
              tab === t.id ? "border-gold text-gold" : "border-transparent text-muted2 hover:text-white"
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.id ? "bg-gold/20 text-gold" : "bg-white/10 text-muted2"}`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-5">
        {tab === "todo" ? (
          !weekend ? (
            <p className="text-xs text-muted">No raid weekend yet.</p>
          ) : todoCount === 0 ? (
            <p className="rounded-xl bg-panel p-4 text-sm text-gold">Everyone used all their raid attacks. 🎉</p>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs text-muted">{live ? "Still have raid attacks to use before the weekend ends." : "Left raid attacks unused last weekend."}</p>
                {live && (
                  <button type="button" onClick={() => void copyReminder()} className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-gold hover:brightness-110">
                    <Copy size={12} /> Copy reminder
                  </button>
                )}
              </div>
              <ul className="max-h-[300px] space-y-1.5 overflow-y-auto pr-1">
                {pending.map(({ r, left }) => (
                  <li key={r.tag} className="flex items-center gap-3 rounded-lg bg-panel px-3 py-2 text-xs">
                    <span className="min-w-0 flex-1 truncate text-sm text-white">{r.name}</span>
                    <Pips used={r.attacks} total={r.attackLimit} />
                    <span className="w-14 shrink-0 text-right font-semibold text-amber-400">{left} left</span>
                  </li>
                ))}
                {noActivity.map((m) => (
                  <li key={m.tag} className="flex items-center gap-3 rounded-lg bg-panel px-3 py-2 text-xs">
                    <span className="min-w-0 flex-1 truncate text-sm text-white">{m.name}</span>
                    <span className="shrink-0 text-muted">no raid activity</span>
                  </li>
                ))}
              </ul>
            </>
          )
        ) : board.rows.length === 0 ? (
          <p className="text-xs text-muted">No raid data yet.</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted">
              {tab === "weekend" ? "Capital gold looted in the latest raid weekend." : `Capital gold looted over the last ${weekendsTracked} weekends.`}
            </p>
            <ol className="space-y-3">
              {board.rows.map((r, i) => (
                <li key={r.tag} className="text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded font-display text-sm font-bold ${i < 3 ? "bg-gold/15 text-gold" : "bg-white/5 text-muted2"}`}>{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-white">{r.name}</span>
                    {tab === "weekend" && r.inLatest && <Pips used={r.attacks} total={r.attackLimit} />}
                    {tab === "total" && <span className="shrink-0 text-muted">{r.weekends}/{weekendsTracked} weekends</span>}
                    <span className="w-16 shrink-0 text-right font-semibold text-white">{formatNumber(board.value(r))}</span>
                  </div>
                  <div className="ml-9 mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold" style={{ width: `${(board.value(r) / board.top) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </section>
  );
}
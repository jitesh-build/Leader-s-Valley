import { useMemo } from "react";
import { Copy } from "lucide-react";
import { formatCountdown } from "../../ClanWars/format";
import { useNow } from "../../ClanWars/hooks/useNow";
import { useLayoutContext } from "../../Layout/useLayoutContext";
import { formatNumber } from "../../Members/format";
import { fillTemplate, useSettings } from "../../Settings/settingsStore";
import type { Member } from "../../Members/types";
import type { RaidWeekend } from "../types";

interface Props {
  weekend: RaidWeekend;
  members: Member[];
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-panel p-4">
      <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold leading-none text-white">{value}</div>
      {sub && <div className="mt-1.5 text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

export default function RaidWeekendPanel({ weekend, members }: Props) {
  const now = useNow(1000);
  const { showToast } = useLayoutContext();
  const [settings] = useSettings();
  const live = weekend.state === "ongoing";
  const remaining = new Date(weekend.endTime).getTime() - now.getTime();
  const usedPct = weekend.attackLimit ? Math.round((weekend.totalAttacks / weekend.attackLimit) * 100) : 0;

  // Members who still have raid attacks left.
  const pending = useMemo(
    () =>
      members
        .map((m) => ({ m, left: m.capital.attackLimit - m.capital.attacksUsed }))
        .filter((x) => x.left > 0)
        .sort((a, b) => b.left - a.left || a.m.name.localeCompare(b.m.name)),
    [members]
  );

  async function copyReminder() {
    // const text = `Raid weekend reminder — still have attacks left: ${pending.map((p) => `${p.m.name} (${p.left})`).join(", ")}. Please use them before it ends!`;
    const text = fillTemplate(settings.raidReminderTemplate, {
      players: pending.map((p) => `${p.m.name} (${p.left})`).join(", "),
      clan: settings.clanName,
    });
    try {
      await navigator.clipboard.writeText(text);
      showToast("Reminder copied — paste it in clan chat");
    } catch {
      showToast("Couldn't copy to the clipboard");
    }
  }

  return (
    <section className="rounded-xl border border-line bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] ${live ? "text-green-400" : "text-muted2"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulse bg-green-400" : "bg-muted"}`} />
            {live ? "RAID WEEKEND LIVE" : "RAID WEEKEND ENDED"}
          </div>
          <h2 className="mt-2 font-display text-[26px] font-bold text-white">Raid weekend</h2>
        </div>
        {live && (
          <div className="rounded-lg border border-line bg-panel px-3 py-2 text-sm font-semibold text-white">
            <span className="mr-2 text-xs font-normal text-muted">Ends in</span>
            {formatCountdown(remaining)}
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile label="CAPITAL GOLD LOOTED" value={formatNumber(weekend.capitalTotalLoot)} />
        <Tile label="ATTACKS USED" value={`${weekend.totalAttacks}`} sub={`of ${weekend.attackLimit} · ${usedPct}%`} />
        <Tile label="DISTRICTS DESTROYED" value={String(weekend.enemyDistrictsDestroyed)} />
        <Tile label="RAID MEDALS" value={formatNumber(weekend.offensiveReward + weekend.defensiveReward)} sub={`${formatNumber(weekend.offensiveReward)} off · ${formatNumber(weekend.defensiveReward)} def`} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">ATTACK LOG</div>
          <ul className="mt-3 space-y-3">
            {weekend.attackLog.map((e) => (
              <li key={e.name} className="text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-white">
                    {e.name} <span className="font-normal text-muted">· Lv {e.level}</span>
                  </span>
                  <span className="text-muted2">{e.attackCount} attacks</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex flex-1 gap-0.5" aria-hidden="true">
                    {Array.from({ length: e.districtCount }, (_, i) => (
                      <span key={i} className={`h-1.5 flex-1 rounded-full ${i < e.districtsDestroyed ? "bg-gold" : "bg-white/10"}`} />
                    ))}
                  </div>
                  <span className="shrink-0 text-[11px] text-muted">
                    {e.districtsDestroyed}/{e.districtCount} destroyed
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">STILL TO ATTACK · {pending.length}</div>
            {pending.length > 0 && (
              <button onClick={() => void copyReminder()} className="flex items-center gap-1.5 text-[11px] text-gold hover:brightness-110">
                <Copy size={12} /> Copy reminder
              </button>
            )}
          </div>
          {pending.length === 0 ? (
            <p className="mt-3 text-xs text-gold">Everyone has used all their raid attacks.</p>
          ) : (
            <ul className="mt-3 max-h-[210px] space-y-1.5 overflow-y-auto pr-1">
              {pending.map(({ m, left }) => (
                <li key={m.tag} className="flex items-center justify-between rounded-lg bg-panel px-3 py-2 text-xs">
                  <span className="truncate text-white">{m.name}</span>
                  <span className="shrink-0 font-semibold text-amber-400">
                    {left} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
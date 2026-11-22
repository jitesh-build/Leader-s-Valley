import { useMemo } from "react";
import { Coins, Landmark, RefreshCw, ShieldCheck, Trophy } from "lucide-react";
import { useClanData } from "../../lib/ClanDataProvider";
import ClanTagForm from "../ClanWars/components/ClanTagForm";
import { formatCountdown } from "../ClanWars/format";
import { useNow } from "../ClanWars/hooks/useNow";
import StatCard from "../Home/components/Statcard";
import { formatNumber } from "../Members/format";
import DistrictGrid from "./components/DistrictGrid";
import RaidHistoryPanel from "./components/RaidHistoryPanel";
import RaidersPanel from "./components/RaidersPanel";
import RaidWeekendPanel from "./components/RaidWeekendPanel";
import UpgradeFocusPanel from "./components/UpgradeFocusPanel";
import { useCapitalData } from "./hooks/useCapitalData";
import { useUpgradeFocus } from "./hooks/useUpgradeFocus";
import type { RaidWeekend } from "./types";

function Skeleton() {
  const bar = "animate-pulse rounded-xl bg-white/5";
  return (
    <div aria-hidden className="mt-9 space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${bar} h-[110px]`} />
        ))}
      </div>
      <div className={`${bar} h-[300px]`} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.6fr]">
        <div className={`${bar} h-[340px]`} />
        <div className={`${bar} h-[340px]`} />
      </div>
    </div>
  );
}

/** Shown only while a raid weekend is running: time left, how many attacks are used, who still has some. */
function LiveBanner({ weekend, pending }: { weekend: RaidWeekend; pending: number }) {
  const now = useNow(1000);
  const end = weekend.endTime ? Date.parse(weekend.endTime) : NaN;
  const remaining = end - now.getTime();
  if (Number.isNaN(remaining) || remaining <= 0) return null;
  const usedPct = weekend.attackLimit ? Math.min(100, Math.round((weekend.totalAttacks / weekend.attackLimit) * 100)) : 0;

  return (
    <div role="status" className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-green-500/30 bg-green-500/[0.06] px-5 py-4">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-green-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
          RAID WEEKEND LIVE
        </div>
        <div className="mt-1 font-display text-2xl font-bold leading-none text-white">
          {formatCountdown(remaining)} <span className="text-sm font-normal text-muted">left</span>
        </div>
      </div>
      <div className="min-w-[200px] flex-1">
        <div className="flex justify-between text-[11px] text-muted">
          <span>Attacks used</span>
          <span className="font-semibold text-white">
            {weekend.totalAttacks}/{weekend.attackLimit} · {usedPct}%
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold" style={{ width: `${usedPct}%` }} />
        </div>
      </div>
      <div className={`rounded-full px-3 py-1.5 text-xs font-semibold ${pending > 0 ? "bg-amber-500/15 text-amber-400" : "bg-green-500/15 text-green-400"}`}>
        {pending > 0 ? `${pending} member${pending === 1 ? "" : "s"} still ${pending === 1 ? "has" : "have"} attacks` : "Everyone has attacked"}
      </div>
    </div>
  );
}

export default function CapitalHallPage() {
  const { setClanTag } = useClanData();
  const { clanTag, data, loading, refreshing, error, updatedAt, refresh } = useCapitalData();
  const { focus, update, setCost } = useUpgradeFocus();

  const districts = data?.capital.districts;
  const target = useMemo(() => {
    const upgradable = (districts ?? []).filter((d) => d.level < d.maxLevel);
    return upgradable.find((d) => d.id === focus.districtId) ?? upgradable[0] ?? null;
  }, [districts, focus.districtId]);

  const avgWeeklyLoot = data && data.history.length ? Math.round(data.history.reduce((s, h) => s + h.totalLoot, 0) / data.history.length) : 0;
  const updated = updatedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-[11px] font-semibold tracking-[0.16em] text-gold-dim">CLAN CAPITAL</div>
        <h1 className="mt-5 font-display text-[32px] font-bold sm:text-[40px] leading-none text-white">Capital Hall</h1>
        <p className="mt-3 text-sm text-muted">Districts, upgrades and raid weekends — what to build next and who's pulling their weight.</p>
      </div>
      {clanTag !== null && (
        <button
          type="button"
          onClick={refresh}
          disabled={loading || refreshing}
          aria-label="Refresh capital data"
          title={updated ? `Updated ${updated}` : "Refresh"}
          className="mb-1 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-xs text-muted2 hover:text-white disabled:opacity-60"
        >
          <RefreshCw size={13} className={loading || refreshing ? "animate-spin" : ""} />
          {updated ? `Live · ${updated}` : "Refresh"}
        </button>
      )}
    </div>
  );

  if (clanTag === null) {
    return (
      <div className="px-4 pb-10 pt-8 sm:px-8 lg:px-12 lg:pt-10">
        {header}
        <div className="mt-9">
          <ClanTagForm onSave={setClanTag} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 pb-10 pt-8 sm:px-8 lg:px-12 lg:pt-10">
        {header}
        {loading ? (
          <Skeleton />
        ) : (
          <div role="alert" className="mt-9 rounded-xl border border-red-900/60 bg-red-950/30 px-6 py-8 text-sm text-red-200">
            <p>{error?.message ?? "Couldn't load the capital."}</p>
            {error?.status === 404 && <p className="mt-1 text-red-200/70">Check the clan tag in Settings → Clan profile.</p>}
            <button type="button" onClick={refresh} className="mt-4 rounded-lg border border-red-800/70 px-3 py-1.5 text-xs font-bold text-red-100 hover:bg-red-900/40">
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!data.unlocked) {
    return (
      <div className="px-4 pb-10 pt-8 sm:px-8 lg:px-12 lg:pt-10">
        {header}
        <div className="mt-9 flex items-center gap-4 rounded-xl border border-line bg-card px-6 py-8">
          <Landmark size={28} className="shrink-0 text-gold" strokeWidth={1.6} />
          <div>
            <div className="font-display text-xl font-bold text-white">This clan hasn't unlocked the Clan Capital</div>
            <p className="mt-1 text-sm text-muted">The Capital Hall, districts and raid weekends appear here once the clan has built its capital in the game.</p>
          </div>
        </div>
      </div>
    );
  }

  const { capital, weekend, history, raiders, noActivity, weekendsTracked } = data;
  const levels = capital.districts.reduce((s, d) => s + d.level, 0);
  const maxLevels = capital.districts.reduce((s, d) => s + d.maxLevel, 0);
  const pct = maxLevels > 0 ? Math.round((levels / maxLevels) * 100) : 0;
  const maxed = capital.districts.filter((d) => d.level >= d.maxLevel).length;
  const pendingRaiders = raiders.filter((r) => r.inLatest && r.attacks < r.attackLimit).length + noActivity.length;

  return (
    <div className="px-4 pb-10 pt-8 sm:px-8 lg:px-12 lg:pt-10">
      {header}

      {error && (
        <p role="alert" className="mt-5 text-xs font-semibold text-amber-400">
          Couldn't refresh just now — showing the last data we got.
        </p>
      )}

      {weekend?.state === "ongoing" && <LiveBanner weekend={weekend} pending={pendingRaiders} />}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Capital Hall" value={`Level ${capital.hallLevel}`} suffix={`/ ${capital.hallMaxLevel}`} sub={`${pct}% of all levels upgraded`} subTone="green" icon={Landmark} tone="purple" />
        <StatCard label="Districts maxed" value={String(maxed)} suffix={`/ ${capital.districts.length}`} sub={`${capital.districts.length - maxed} left to max`} icon={ShieldCheck} tone="gold" />
        <StatCard
          label="Raid loot"
          value={weekend ? formatNumber(weekend.capitalTotalLoot) : "—"}
          sub={weekend ? `${weekend.totalAttacks}/${weekend.attackLimit} attacks used` : "No raid weekend yet"}
          icon={Coins}
          tone="blue"
        />
        <StatCard
          label="Capital league"
          value={capital.league ?? "Unranked"}
          sub={capital.points !== null ? `${formatNumber(capital.points)} capital points` : "—"}
          icon={Trophy}
          tone="red"
        />
      </div>

      <div className="mt-5 space-y-5">
        <DistrictGrid districts={capital.districts} focusId={target?.id ?? null} onSelect={(id) => update({ districtId: id })} />

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_1.6fr]">
          <UpgradeFocusPanel districts={capital.districts} target={target} focus={focus} onChange={update} onCost={setCost} avgWeeklyLoot={avgWeeklyLoot} />
          <RaidWeekendPanel weekend={weekend} />
        </div>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          <RaidHistoryPanel
            history={history}
            current={weekend ? { totalLoot: weekend.capitalTotalLoot, medals: weekend.offensiveReward + weekend.defensiveReward, live: weekend.state === "ongoing" } : null}
          />
          <RaidersPanel raiders={raiders} noActivity={noActivity} weekend={weekend} weekendsTracked={weekendsTracked} />
        </div>
      </div>
    </div>
  );
}
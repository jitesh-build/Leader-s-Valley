import { useMemo } from "react";
import { Coins, Gem, Info, Landmark, ShieldCheck } from "lucide-react";
import StatCard from "../Home/components/Statcard";
import { formatNumber } from "../Members/format";
import DistrictGrid from "./components/DistrictGrid";
import RaidHistoryPanel from "./components/RaidHistoryPanel";
import RaidWeekendPanel from "./components/RaidWeekendPanel";
import TopLootersPanel from "./components/TopLootersPanel";
import UpgradeFocusPanel from "./components/UpgradeFocusPanel";
import { useCapitalData } from "./hooks/useCapitalData";
import { useUpgradeFocus } from "./hooks/useUpgradeFocus";

export default function CapitalHallPage() {
  const { capital, weekend, history, members, isSample } = useCapitalData();
  const { focus, update } = useUpgradeFocus();

  const { maxed, pct } = useMemo(() => {
    const levels = capital.districts.reduce((s, d) => s + d.level, 0);
    const max = capital.districts.reduce((s, d) => s + d.maxLevel, 0);
    return { maxed: capital.districts.filter((d) => d.level >= d.maxLevel).length, pct: Math.round((levels / max) * 100) };
  }, [capital]);

  const contributed = members.reduce((s, m) => s + m.capital.goldContributedTotal, 0);
  const topContributor = [...members].sort((a, b) => b.capital.goldContributedTotal - a.capital.goldContributedTotal)[0];
  const avgWeeklyLoot = history.length ? Math.round(history.reduce((s, h) => s + h.totalLoot, 0) / history.length) : 0;

  return (
    <div className="px-12 pb-10 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.16em] text-gold-dim">CLAN CAPITAL</div>
          <h1 className="mt-5 font-display text-[40px] font-bold leading-none text-white">Capital Hall</h1>
          <p className="mt-3 text-sm text-muted">Districts, upgrades and raid weekends — what to build next and who's pulling their weight.</p>
        </div>
        {isSample && (
          <div className="mb-1 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-xs text-muted2">
            <Info size={14} className="text-gold" />
            Sample data — connect the Clash of Clans API to go live
          </div>
        )}
      </div>

      <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Capital Hall" value={`Level ${capital.hallLevel}`} sub={`${pct}% upgraded`} subTone="green" icon={Landmark} tone="purple" />
        <StatCard label="Districts maxed" value={String(maxed)} suffix={`/ ${capital.districts.length}`} sub={`${capital.districts.length - maxed} left to max`} icon={ShieldCheck} tone="gold" />
        <StatCard label="Raid loot" value={formatNumber(weekend.capitalTotalLoot)} sub={`${weekend.totalAttacks}/${weekend.attackLimit} attacks used`} icon={Coins} tone="blue" />
        <StatCard label="Gold contributed" value={formatNumber(contributed)} sub={topContributor ? `Top: ${topContributor.name}` : "—"} icon={Gem} tone="red" />
      </div>

      <div className="mt-5 space-y-5">
        <DistrictGrid districts={capital.districts} focusId={focus.districtId} onSelect={(id) => update({ districtId: id })} />

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_1.6fr]">
          <UpgradeFocusPanel districts={capital.districts} focus={focus} onChange={update} avgWeeklyLoot={avgWeeklyLoot} />
          <RaidWeekendPanel weekend={weekend} members={members} />
        </div>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          <RaidHistoryPanel history={history} current={{ totalLoot: weekend.capitalTotalLoot, medals: weekend.offensiveReward + weekend.defensiveReward }} />
          <TopLootersPanel members={members} />
        </div>
      </div>
    </div>
  );
}
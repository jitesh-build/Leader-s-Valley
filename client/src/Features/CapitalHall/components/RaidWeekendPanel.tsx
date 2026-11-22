import { Shield } from "lucide-react";
import { formatCountdown } from "../../ClanWars/format";
import { useNow } from "../../ClanWars/hooks/useNow";
import { formatNumber } from "../../Members/format";
import type { RaidEnemy, RaidWeekend } from "../types";

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-panel p-4">
      <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold leading-none text-white">{value}</div>
      {sub && <div className="mt-1.5 text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

function EnemyRow({ e, tone }: { e: RaidEnemy; tone: "gold" | "red" }) {
  return (
    <li className="text-xs">
      <div className="flex justify-between gap-2">
        <span className="min-w-0 truncate font-semibold text-white">
          {e.name} {e.level !== null && <span className="font-normal text-muted">· Lv {e.level}</span>}
        </span>
        <span className="shrink-0 text-muted2">{e.attackCount} attacks</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex flex-1 gap-0.5" aria-hidden>
          {Array.from({ length: Math.max(e.districtCount, e.districtsDestroyed, 1) }, (_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i < e.districtsDestroyed ? (tone === "gold" ? "bg-gold" : "bg-red-400") : "bg-white/10"}`} />
          ))}
        </div>
        <span className="shrink-0 text-[11px] text-muted">
          {e.districtsDestroyed}/{e.districtCount} destroyed
        </span>
      </div>
    </li>
  );
}

export default function RaidWeekendPanel({ weekend }: { weekend: RaidWeekend | null }) {
  const now = useNow(1000);

  if (!weekend) {
    return (
      <section aria-label="Raid weekend" className="rounded-xl border border-line bg-card p-6">
        <div className="text-[11px] font-bold tracking-[0.14em] text-muted2">RAID WEEKEND</div>
        <h2 className="mt-2 font-display text-[26px] font-bold text-white">No raid weekend yet</h2>
        <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          Once your clan starts a raid weekend (Friday to Monday), the loot, attacks and enemy capitals show up here.
        </p>
      </section>
    );
  }

  const live = weekend.state === "ongoing";
  const endMs = weekend.endTime ? Date.parse(weekend.endTime) : NaN;
  const remaining = endMs - now.getTime();
  const usedPct = weekend.attackLimit ? Math.round((weekend.totalAttacks / weekend.attackLimit) * 100) : 0;

  return (
    <section aria-label="Raid weekend" className="rounded-xl border border-line bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] ${live ? "text-green-400" : "text-muted2"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulse bg-green-400" : "bg-muted"}`} />
            {live ? "RAID WEEKEND LIVE" : "LAST RAID WEEKEND"}
          </div>
          <h2 className="mt-2 font-display text-[26px] font-bold text-white">Raid weekend</h2>
        </div>
        {live && !Number.isNaN(remaining) && (
          <div className="rounded-lg border border-line bg-panel px-3 py-2 text-sm font-semibold text-white">
            <span className="mr-2 text-xs font-normal text-muted">Ends in</span>
            {formatCountdown(remaining)}
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile label="CAPITAL GOLD LOOTED" value={formatNumber(weekend.capitalTotalLoot)} />
        <Tile label="ATTACKS USED" value={String(weekend.totalAttacks)} sub={`of ${weekend.attackLimit} · ${usedPct}%`} />
        <Tile label="DISTRICTS DESTROYED" value={String(weekend.enemyDistrictsDestroyed)} />
        <Tile label="RAID MEDALS" value={formatNumber(weekend.offensiveReward + weekend.defensiveReward)} sub={`${formatNumber(weekend.offensiveReward)} off · ${formatNumber(weekend.defensiveReward)} def`} />
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold" style={{ width: `${Math.min(100, usedPct)}%` }} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">CAPITALS WE RAIDED</div>
          {weekend.attackLog.length === 0 ? (
            <p className="mt-3 text-xs text-muted">No raids recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {weekend.attackLog.map((e, i) => (
                <EnemyRow key={`${e.name}-${i}`} e={e} tone="gold" />
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted">
            <Shield size={11} /> CLANS THAT RAIDED US
          </div>
          {weekend.defenseLog.length === 0 ? (
            <p className="mt-3 text-xs text-muted">Nobody has raided your capital this weekend.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {weekend.defenseLog.map((e, i) => (
                <EnemyRow key={`${e.name}-${i}`} e={e} tone="red" />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
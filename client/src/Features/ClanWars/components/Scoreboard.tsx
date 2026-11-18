import { Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import ClanBadge from "../../Home/components/Clanbadge";
import { formatCountdown, initials } from "../format";
import { useNow } from "../hooks/useNow";
import type { War, WarState } from "../types";

interface Props {
  war: War;
  /** Members with at least one broken rule. */
  violatedMembers: number;
  /** Members who aren't in violation yet but will be if nothing changes. */
  atRiskMembers: number;
}

const STATE_META: Record<WarState, { label: string; text: string; dot: string; timerLabel: string }> = {
  preparation: { label: "PREPARATION DAY", text: "text-blue-400", dot: "bg-blue-500", timerLabel: "Starts in" },
  inWar: { label: "BATTLE DAY", text: "text-red-400", dot: "bg-red-500 animate-pulse", timerLabel: "Ends in" },
  warEnded: { label: "WAR ENDED", text: "text-muted2", dot: "bg-muted", timerLabel: "Final result" },
};

export default function Scoreboard({ war, violatedMembers, atRiskMembers }: Props) {
  const now = useNow(1000);
  const meta = STATE_META[war.state];
  const { clan, opponent } = war;

  const target = war.state === "preparation" ? war.startTime : war.state === "inWar" ? war.endTime : null;
  const remaining = target ? new Date(target).getTime() - now.getTime() : null;

  const maxAttacks = war.teamSize * war.attacksPerMember;
  const totalStars = clan.stars + opponent.stars;
  const share = totalStars === 0 ? 50 : (clan.stars / totalStars) * 100;

  return (
    <div className="flex justify-center">
    <section className=" rounded-xl w-max border-2 border-line bg-black/50">
      <div className="flex flex-col items-center justify-center px-4 py-3 gap-1 w-[640px] max-w-full">
  {/* clan names */}
  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 w-full">
    <span
      className="truncate text-right text-2xl font-extrabold text-white"
      style={{ textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 0 #000" }}
    >
      {clan.name}
    </span>
    <div className="flex items-center gap-1">
      <ClanBadge initials={initials(clan.name)} size={46} fill="#5a4518" textClass="text-gold" />
      <span
        className="text-xl font-extrabold text-white"
        style={{ textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}
      >
        vs
      </span>
      <ClanBadge initials={initials(opponent.name)} size={46} fill="#6b2a28" textClass="text-red-200" />
    </div>
    <span
      className="truncate text-left text-2xl font-extrabold text-white"
      style={{ textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 0 #000" }}
    >
      {opponent.name}
    </span>
  </div>

  {/* war stars */}
  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 w-full">
    {/* left bar */}
    <div className="relative h-11">
      <div className="absolute left-5 right-0 top-1/2 h-6 -translate-y-1/2 overflow-hidden rounded-md border-2 border-black/70 bg-gradient-to-b from-neutral-300 to-neutral-500">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-b from-amber-400 to-orange-500"
          style={{ width: `${clan.destructionPercentage}%` }}
        />
        <div className="absolute left-1 right-1 top-0.5 z-10 h-1.5 rounded-full bg-white/30" />
        <span
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-sm font-bold text-white"
          style={{ textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}
        >
          {Math.round(clan.destructionPercentage)}
        </span>
      </div>
      <img
  src="/cw_star.png"
  alt=""
  className="absolute -left-16 top-1/2 z-20 -translate-y-1/2 object-contain"
  style={{ width: 180, height: 180, maxWidth: "none" }}
/>
    </div>

    {/* timer */}
    <div className="flex min-w-24 flex-col items-center leading-tight">
      <span
        className="text-lg font-extrabold text-red-500"
        style={{ textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}
      >
        {remaining !== null ? formatCountdown(remaining) : meta.timerLabel}
      </span>
      <span
        className="text-base font-bold text-orange-500"
        style={{ textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}
      >
        {meta.label}
      </span>
    </div>

    {/* right bar */}
    <div className="relative h-11">
      <div className="absolute left-0 right-5 top-1/2 h-6 -translate-y-1/2 overflow-hidden rounded-md border-2 border-black/70 bg-gradient-to-b from-neutral-300 to-neutral-500">
        <div
          className="absolute right-0 top-0 h-full bg-gradient-to-b from-amber-400 to-orange-500"
          style={{ width: `${opponent.destructionPercentage}%` }}
        />
        <div className="absolute left-1 right-1 top-0.5 z-10 h-1.5 rounded-full bg-white/30" />
        <span
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 text-sm font-bold text-white"
          style={{ textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}
        >
          {Math.round(opponent.destructionPercentage)}
        </span>
      </div>
      <img
  src="/cw_star.png"
  alt=""
  className="absolute -right-16 top-1/2 z-20 -translate-y-1/2 object-contain"
  style={{ width: 180, height: 180, maxWidth: "none" }}
/>
    </div>
  </div>

  {/* attacks completed */}
  <div className="flex justify-between w-full px-1">
    <div className="flex items-center gap-1">
      <img
  src="/cw_sword.png"
  alt=""
  className="object-contain"
  style={{ width: 24, height: 24, maxWidth: "none" }}
/>
      <span
        className="text-sm font-bold text-white"
        style={{ textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}
      >
        {clan.attacks}/{maxAttacks}
      </span>
    </div>
    <div className="flex flex-row-reverse items-center gap-1">
      <img src="/cw_sword.png" alt="" className="h-5 w-5 object-contain" />
      <span
        className="text-sm font-bold text-white"
        style={{ textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}
      >
        {opponent.attacks}/{maxAttacks}
      </span>
    </div>
  </div>
</div>
      {/* old ui */}
      {/* <div className="flex items-start justify-between px-6 pb-6 pt-6">
        <div>
          <div className={`flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] ${meta.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </div>
          <h2 className="mt-2 font-display text-[26px] font-bold text-white">
            {war.teamSize} vs {war.teamSize}
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-semibold text-white">
          <Clock size={14} className="text-gold" />
          {remaining !== null ? (
            <>
              <span className="text-xs font-normal text-muted">{meta.timerLabel}</span>
              {formatCountdown(remaining)}
            </>
          ) : (
            meta.timerLabel
          )}
        </div>
      </div> */}

      {/* <div className="flex items-center justify-center px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-10">
          <div className="flex flex-col items-center gap-1">
            <ClanBadge initials={initials(clan.name)} size={46} fill="#5a4518" textClass="text-gold" />
            <div className="mt-2 font-display text-base font-bold text-white">{clan.name}</div>
            <div className="text-[11px] text-muted">
              {clan.attacks}/{maxAttacks} attacks
            </div>
          </div>

          <div className="w-[220px]">
            <div className="flex items-center justify-between font-display text-[44px] font-bold leading-none">
              <span className="text-white">{clan.stars}</span>
              <span className="text-lg text-muted/60">—</span>
              <span className="text-white/60">{opponent.stars}</span>
            </div>
            <div className="text-center text-[9px] font-semibold tracking-[0.14em] text-muted">STARS</div>
            <div className="mt-2 flex h-1 overflow-hidden rounded-full bg-red-800">
              <div className="h-full bg-gold" style={{ width: `${share}%` }} />
            </div>
            <div className="mt-2 text-center text-[11px] text-muted">
              {clan.destructionPercentage.toFixed(1)}% — {opponent.destructionPercentage.toFixed(1)}% destruction
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <ClanBadge initials={initials(opponent.name)} size={46} fill="#6b2a28" textClass="text-red-200" />
            <div className="mt-2 font-display text-base font-bold text-white">{opponent.name}</div>
            <div className="text-[11px] text-muted">
              {opponent.attacks}/{maxAttacks} attacks
            </div>
          </div>
        </div>
      </div> */}

      {/* <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-5 text-sm">
        <span className="text-muted">
          {war.attacksPerMember} attack{war.attacksPerMember === 1 ? "" : "s"} per member
        </span>
        {violatedMembers > 0 || atRiskMembers > 0 ? (
          <span className="flex items-center gap-2 font-semibold">
            <ShieldAlert size={14} className={violatedMembers > 0 ? "text-red-400" : "text-amber-400"} />
            {violatedMembers > 0 && (
              <span className="text-red-400">
                {violatedMembers} rule breaker{violatedMembers === 1 ? "" : "s"}
              </span>
            )}
            {atRiskMembers > 0 && <span className="text-amber-400">{atRiskMembers} at risk</span>}
          </span>
        ) : (
          <span className="flex items-center gap-2 font-semibold text-gold">
            <ShieldCheck size={14} /> No rule breakers
          </span>
        )}
      </div> */}
    </section>
    </div>
  );
}
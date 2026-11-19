import { Clock, ChevronRight } from "lucide-react";
import type { ApiOverview } from "../../../lib/clashApi";
import { useNow } from "../../ClanWars/hooks/useNow";
import { formatRemaining, initialsOf } from "../data/buildHome";
import ClanBadge from "./Clanbadge";

interface Props {
  overview: ApiOverview | null;
  loading: boolean;
  /** The clan's war log is private, so the game hides war data. */
  warUnavailable: boolean;
  onOpenWarRoom: () => void;
}

function Shell({ eyebrow, eyebrowClass, dot, title, timer, children, footer }: {
  eyebrow: string;
  eyebrowClass: string;
  dot: string;
  title: string;
  timer?: string | undefined;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-card">
      <div className="flex items-start justify-between px-6 pb-6 pt-6">
        <div>
          <div className={`flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] ${eyebrowClass}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {eyebrow}
          </div>
          <h2 className="mt-2 font-display text-[26px] font-bold text-white">{title}</h2>
        </div>
        {timer && (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-semibold text-white">
            <Clock size={14} className="text-gold" />
            {timer}
          </div>
        )}
      </div>
      {children}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 text-sm">{footer}</div>
    </section>
  );
}

export default function WarCard({ overview, loading, warUnavailable, onOpenWarRoom }: Props) {
  const now = useNow(30_000);
  const war = overview?.war ?? null;

  const warRoomLink = (
    <button type="button" onClick={onOpenWarRoom} className="flex items-center gap-1 font-semibold text-gold hover:text-gold-soft">
      Open war room <ChevronRight size={14} />
    </button>
  );

  // ---- nothing to draw: loading / private log / no war
  if (!war) {
    const cwl = overview?.cwl ?? null;
    const message = loading
      ? "Asking Clash of Clans for the latest…"
      : warUnavailable
        ? "The clan's war log is private, so the game hides war data. A leader can make it public in the game: Clan settings → War log → Public."
        : cwl?.round
          ? `Your clan is in the Clan War League (season ${cwl.season ?? "?"}). Round ${cwl.round} has started, but your war wasn't found in it.`
          : cwl
            ? `Your clan is in the Clan War League (season ${cwl.season ?? "?"}) — the first round hasn't started yet.`
            : "Start a war in the game and it will show up here.";
    return (
      <Shell
        eyebrow={loading ? "LOADING" : "NO WAR"}
        eyebrowClass="text-muted2"
        dot="bg-muted"
        title={loading ? "Loading war…" : "Not in a war right now"}
        footer={
          <>
            <span className="text-muted">Wars appear here as soon as they begin.</span>
            {warRoomLink}
          </>
        }
      >
        <div className="flex items-center justify-center border-y border-line px-6 py-12 text-center text-sm text-muted2">
          <p className="max-w-md">{message}</p>
        </div>
      </Shell>
    );
  }

  // ---- a war to show
  const { us, them } = war;
  const startMs = war.startTime ? Date.parse(war.startTime) : NaN;
  const endMs = war.endTime ? Date.parse(war.endTime) : NaN;
  const nowMs = now.getTime();

  const isCwl = war.kind === "cwl";
  let eyebrow = isCwl ? `CWL ROUND ${war.round ?? ""}`.trim() : "WAR DAY";
  let eyebrowClass = "text-red-400";
  let dot = "bg-red-500";
  let title = "Battle in progress";
  let timer: string | undefined;

  if (war.state === "preparation") {
    eyebrow = isCwl ? `CWL ROUND ${war.round ?? ""} · PREPARATION`.replace("  ", " ") : "PREPARATION DAY";
    eyebrowClass = "text-blue-400";
    dot = "bg-blue-500";
    title = "War starts soon";
    timer = Number.isNaN(startMs) ? undefined : `${formatRemaining(startMs - nowMs)} to start`;
  } else if (war.state === "inWar") {
    timer = Number.isNaN(endMs) ? undefined : `${formatRemaining(endMs - nowMs)} left`;
  } else {
    eyebrow = isCwl ? `CWL ROUND ${war.round ?? ""} · ENDED`.replace("  ", " ") : "WAR ENDED";
    eyebrowClass = "text-muted2";
    dot = "bg-muted";
    const ourScore = us.stars * 1000 + us.destructionPercentage;
    const theirScore = them.stars * 1000 + them.destructionPercentage;
    title = ourScore > theirScore ? "Victory" : ourScore < theirScore ? "Defeat" : "Draw";
  }

  const totalStars = us.stars + them.stars;
  const share = totalStars === 0 ? 50 : (us.stars / totalStars) * 100;
  const attacksLeft = Math.max(0, war.teamSize * war.attacksPerMember - us.attacks);
  const usName = us.name ?? "Your clan";
  const themName = them.name ?? "Opponent";

  return (
    <Shell
      eyebrow={eyebrow}
      eyebrowClass={eyebrowClass}
      dot={dot}
      title={title}
      timer={timer}
      footer={
        <>
          <span className="text-muted">
            {war.state === "warEnded"
              ? `${us.attacks} of ${war.teamSize * war.attacksPerMember} attacks were used.`
              : war.state === "preparation"
                ? `${war.teamSize} vs ${war.teamSize} · ${war.attacksPerMember} attack${war.attacksPerMember === 1 ? "" : "s"} each`
                : `${attacksLeft} attack${attacksLeft === 1 ? "" : "s"} still unused`}
          </span>
          {warRoomLink}
        </>
      }
    >
      <div className="flex items-center justify-center border-y border-line px-6 py-12">
        <div className="flex flex-wrap items-center justify-center gap-10">
          <div className="flex flex-col items-center gap-1">
            <ClanBadge initials={initialsOf(usName)} size={46} fill="#5a4518" textClass="text-gold" />
            <div className="mt-2 max-w-[160px] truncate font-display text-base font-bold text-white">{usName}</div>
            <div className="text-[11px] text-muted">{us.attacks} attacks</div>
          </div>

          <div className="w-[220px]">
            <div className="flex items-center justify-between font-display text-[44px] font-bold leading-none">
              <span className="text-white">{us.stars}</span>
              <span className="text-lg text-muted/60">—</span>
              <span className="text-white/60">{them.stars}</span>
            </div>
            <div className="text-center text-[9px] font-semibold tracking-[0.14em] text-muted">STARS</div>
            <div className="mt-2 flex h-1 overflow-hidden rounded-full bg-red-800">
              <div className="h-full bg-gold" style={{ width: `${share}%` }} />
            </div>
            <div className="mt-2 text-center text-[11px] text-muted">
              {us.destructionPercentage.toFixed(1)}% — {them.destructionPercentage.toFixed(1)}% destruction
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <ClanBadge initials={initialsOf(themName)} size={46} fill="#6b2a28" textClass="text-red-200" />
            <div className="mt-2 max-w-[160px] truncate font-display text-base font-bold text-white">{themName}</div>
            <div className="text-[11px] text-muted">{them.attacks} attacks</div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
import { AlertTriangle, Landmark, ListChecks, Swords, TrendingUp } from "lucide-react";
import type { RoleMember } from "../types";
import { Pill, TownHall } from "./ui";

interface Props {
  member: RoleMember;
  /** Largest season donation in the clan — the donation bar is drawn relative to it. */
  maxDonations: number;
  ready: boolean;
  review: boolean;
  planned: boolean;
  onOpen: () => void;
  /** The big card used for the clan leader. */
  hero?: boolean;
}

function Dots({ used, total }: { used: number; total: number }) {
  if (total > 6) return <span className="font-semibold text-white/80">{used}/{total}</span>;
  return (
    <span className="inline-flex gap-0.5" aria-label={`${used} of ${total} war attacks used`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < used ? "bg-gold" : "bg-white/20"}`} />
      ))}
    </span>
  );
}

/** One clan member: town hall, name, donations bar, and this war / raid at a glance. Click to open the details. */
export default function MemberCard({ member: m, maxDonations, ready, review, planned, onOpen, hero = false }: Props) {
  const ratio = m.donationsReceived > 0 ? m.donations / m.donationsReceived : m.donations;
  const pct = maxDonations > 0 ? Math.round((m.donations / maxDonations) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${m.name}`}
      className={`group w-full rounded-xl border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
        hero
          ? "border-gold/40 bg-gradient-to-br from-gold/10 via-panel to-panel p-5 shadow-[0_0_24px_rgba(217,169,63,0.08)] hover:border-gold/70"
          : "border-line bg-panel p-3.5 hover:border-gold/40 hover:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start gap-3">
        <TownHall level={m.townHallLevel} size={hero ? 64 : 44} />
        <div className="min-w-0 flex-1">
          <div className={`truncate font-bold text-white ${hero ? "font-display text-[28px] leading-tight" : "text-sm"}`}>{m.name}</div>
          <div className="mt-0.5 text-[11px] text-muted">
            TH{m.townHallLevel} · {m.tag}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {ready && <Pill tone="green" icon={<TrendingUp size={9} />}>READY</Pill>}
          {review && <Pill tone="amber" icon={<AlertTriangle size={9} />}>REVIEW</Pill>}
          {planned && <Pill tone="gold" icon={<ListChecks size={9} />}>PLANNED</Pill>}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between text-[11px]">
          <span className="text-muted2">Donated</span>
          <span className="font-display text-base font-bold leading-none text-white">{m.donations.toLocaleString("en-US")}</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="flex items-center gap-1.5" title="Attacks in the current war">
          <Swords size={12} /> {m.war ? <Dots used={m.war.attacksUsed} total={m.war.attacksAvailable} /> : "—"}
        </span>
        <span className="flex items-center gap-1.5" title="Attacks in the latest raid weekend">
          <Landmark size={12} /> {m.raid ? `${m.raid.attacksUsed}/${m.raid.attackLimit}` : "—"}
        </span>
        <span title="Donated ÷ received">Ratio {ratio.toFixed(1)}</span>
      </div>
    </button>
  );
}
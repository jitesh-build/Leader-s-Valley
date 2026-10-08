import { Check, Clock } from "lucide-react";
import ClanBadge from "./Clanbadge";

export default function WarCard() {
  return (
    <section className="rounded-xl border border-line bg-card">
      <div className="flex items-start justify-between px-6 pb-6 pt-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            WAR DAY
          </div>
          <h2 className="mt-2 font-display text-[26px] font-bold text-white">Battle in progress</h2>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-semibold text-white">
          <Clock size={14} className="text-gold" />
          08h 42m
        </div>
      </div>

      <div className="flex items-center justify-center border-y border-line px-6 py-12">
        <div className="flex items-center gap-10">
          <div className="flex flex-col items-center gap-1">
            <ClanBadge initials="DX" size={46} fill="#5a4518" textClass="text-gold" />
            <div className="mt-2 font-display text-base font-bold text-white">Dark Exiles</div>
            <div className="text-[11px] text-muted">31 attacks</div>
          </div>

          <div className="w-[220px]">
            <div className="flex items-center justify-between font-display text-[44px] font-bold leading-none">
              <span className="text-white">42</span>
              <span className="text-lg text-muted/60">—</span>
              <span className="text-white/60">38</span>
            </div>
            <div className="text-center text-[9px] font-semibold tracking-[0.14em] text-muted">STARS</div>
            <div className="mt-2 flex gap-1">
              <div className="h-1 flex-1 rounded-full bg-gold" />
              <div className="h-1 flex-1 rounded-full bg-red-800" />
            </div>
            <div className="mt-2 text-center text-[11px] text-muted">92.4% destruction</div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <ClanBadge initials="NR" size={46} fill="#6b2a28" textClass="text-red-200" />
            <div className="mt-2 font-display text-base font-bold text-white">Nordic Ravens</div>
            <div className="text-[11px] text-muted">34 attacks</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-5 text-sm">
        <span className="text-muted">War plan confirmed. Good luck, Chief.</span>
        <span className="flex items-center gap-2 font-semibold text-gold">
          <Check size={14} /> Prepared
        </span>
      </div>
    </section>
  );
}
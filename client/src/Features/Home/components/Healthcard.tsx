import { MoreHorizontal } from "lucide-react";
import { healthMetrics } from "../data/HomeData";
import ProgressBar from "./Progressbar";

const SCORE = 86;
const R = 34;
const C = 2 * Math.PI * R;

export default function HealthCard() {
  return (
    <section className="rounded-xl border border-line bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">READINESS</div>
          <h2 className="mt-2 font-display text-[26px] font-bold text-white">Clan health</h2>
        </div>
        <MoreHorizontal size={18} className="text-muted" />
      </div>

      <div className="mt-5 flex items-center gap-5 rounded-xl bg-panel p-4">
        <div className="relative h-[76px] w-[76px] shrink-0">
          <svg viewBox="0 0 80 80" className="-rotate-90">
            <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle cx="40" cy="40" r={R} fill="none" stroke="#d9a93f" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - SCORE / 100)} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-xl font-bold leading-none text-white">{SCORE}</span>
            <span className="text-[9px] text-muted">/ 100</span>
          </div>
        </div>
        <div>
          <div className="font-display text-lg font-bold text-white">Battle ready</div>
          <div className="text-xs text-muted">Everything is looking sharp.</div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {healthMetrics.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-4 text-xs">
            <span className="w-[88px] text-muted2">{label}</span>
            <ProgressBar value={value} className="flex-1" />
            <span className="w-9 text-right font-semibold text-white/80">{value}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
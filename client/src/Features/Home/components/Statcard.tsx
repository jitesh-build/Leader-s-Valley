import { ArrowUp } from "lucide-react";
import type { Stat, Tone } from "../types";

const toneStyles: Record<Tone, string> = {
  gold: "bg-gold/10 text-gold",
  red: "bg-red-500/10 text-red-400",
  purple: "bg-purple-500/10 text-purple-400",
  blue: "bg-blue-500/10 text-blue-400",
};

export default function StatCard({ label, value, suffix, sub, subTone, trend, icon: Icon, tone }: Stat) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-card px-6 py-6">
      <div className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
        <Icon size={22} strokeWidth={1.6} />
      </div>
      <div>
        <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">{label.toUpperCase()}</div>
        <div className="mt-1 flex items-baseline gap-2 font-display text-[28px] font-bold leading-none text-white">
          {value}
          {suffix && <span className="font-sans text-sm font-normal text-muted">{suffix}</span>}
        </div>
        <div className={`mt-1.5 flex items-center gap-1 text-[11px] ${subTone === "green" ? "text-green-400" : "text-muted"}`}>
          {trend === "up" && <ArrowUp size={11} />}
          {sub}
        </div>
      </div>
    </div>
  );
}
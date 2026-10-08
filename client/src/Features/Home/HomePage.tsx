import { ChevronRight } from "lucide-react";
import { HealthCard, StatCard, WarCard } from "./components/index";
import { stats } from "./data/HomeData";
import { useLayoutContext } from "../Layout/useLayoutContext";

export default function HomePage() {
  const { showToast } = useLayoutContext();

  return (
    <div className="px-12 pb-10 pt-14">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.16em] text-gold-dim">MONDAY, NOVEMBER 13</div>
          <h1 className="mt-5 font-display text-[40px] font-bold leading-none text-white">Welcome back, Warchief.</h1>
          <p className="mt-3 text-sm text-muted">
            Here's what's happening with <strong className="text-white/90">Dark Exiles</strong> today.
          </p>
        </div>
        <button
          onClick={() => showToast("Clan settings opened")}
          className="mb-1 flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-2.5 text-xs text-muted2 hover:text-white"
        >
          Manage clan <ChevronRight size={14} />
        </button>
      </div>

      <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.75fr_1fr]">
        <WarCard />
        <HealthCard />
      </div>
    </div>
  );
}
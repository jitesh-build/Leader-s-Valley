import type { ReactNode } from "react";
import { AlertTriangle, ListChecks, SlidersHorizontal, TrendingUp, type LucideIcon } from "lucide-react";

export type TabId = "promotions" | "reviews" | "todo" | "criteria";

interface Props {
  tab: TabId;
  onTab: (tab: TabId) => void;
  counts: { promotions: number; reviews: number; todo: number };
  children: ReactNode;
}

const TABS: { id: TabId; label: string; icon: LucideIcon; count?: "promotions" | "reviews" | "todo" }[] = [
  { id: "promotions", label: "Promotions", icon: TrendingUp, count: "promotions" },
  { id: "reviews", label: "Reviews", icon: AlertTriangle, count: "reviews" },
  { id: "todo", label: "To-do", icon: ListChecks, count: "todo" },
  { id: "criteria", label: "Criteria", icon: SlidersHorizontal },
];

/** One tabbed card for everything you can act on, instead of four stacked panels. */
export default function ActionCenter({ tab, onTab, counts, children }: Props) {
  return (
    <section aria-label="Action centre" className="rounded-xl border border-line bg-card">
      <div className="px-6 pt-6">
        <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">ACTION CENTRE</div>
        <h2 className="mt-2 font-display text-[26px] font-bold text-white">What needs you</h2>
      </div>

      <div role="tablist" aria-label="Action centre" className="mt-4 flex gap-1 border-b border-line px-4">
        {TABS.map(({ id, label, icon: Icon, count }) => {
          const active = tab === id;
          const n = count ? counts[count] : 0;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={active}
              aria-controls={`panel-${id}`}
              onClick={() => onTab(id)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
                active ? "border-gold text-gold" : "border-transparent text-muted2 hover:text-white"
              }`}
            >
              <Icon size={13} />
              {label}
              {count && n > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-gold/20 text-gold" : "bg-white/10 text-muted2"}`}>{n}</span>
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="max-h-[calc(100vh-15rem)] min-h-[200px] overflow-y-auto p-5">
        {children}
      </div>
    </section>
  );
}
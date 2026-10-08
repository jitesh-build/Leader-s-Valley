import { NavLink } from "react-router-dom";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { navItems } from "../data/HomeData";
import ClanBadge from "./Clanbadge";
import ProgressBar from "./Progressbar";

interface Props {
  onOpenClan: () => void;
  /** Called when a nav item without a page (no `path`) is clicked. */
  onComingSoon: (label: string) => void;
}

const baseItem = "relative flex h-[54px] items-center gap-4 rounded-lg px-4 text-[15px] font-medium transition";
const inactiveItem = "text-muted2 hover:bg-white/5 hover:text-white";

export default function Sidebar({ onOpenClan, onComingSoon }: Props) {
  return (
    <aside className="flex h-screen w-[310px] shrink-0 flex-col border-r border-line bg-panel">
      {/* Logo */}
      <div className="flex items-center gap-3 px-9 pt-9">
        <ClanBadge initials="F" size={34} fill="rgba(217,169,63,0.08)" stroke="#d9a93f" />
        <div>
          <div className="font-display text-[22px] font-bold leading-none tracking-wide text-white">
            Leader's<span className="text-gold"> Valley</span>
          </div>
          <div className="mt-2 text-[10px] font-semibold tracking-[0.18em] text-muted">LEADER COMMAND</div>
        </div>
      </div>

      {/* Clan switcher */}
      <button
        onClick={onOpenClan}
        className="mx-6 mt-9 flex items-center gap-4 rounded-xl border border-line bg-card px-5 py-4 text-left transition hover:border-gold/40"
      >
        <ClanBadge initials="DX" size={38} fill="rgba(217,169,63,0.12)" stroke="#d9a93f" />
        <div className="flex-1">
          <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">YOUR CLAN</div>
          <div className="font-display text-xl font-bold leading-tight text-white">Dark Exiles</div>
          <div className="text-xs text-muted">Level 18 · #2L8Y9J</div>
        </div>
        <ChevronRight size={16} className="text-muted" />
      </button>

      {/* Nav */}
      <div className="mt-7 px-9 text-[10px] font-semibold tracking-[0.18em] text-muted">COMMAND CENTER</div>
      <nav className="mt-3 flex flex-col gap-1.5 px-6">
        {navItems.map(({ label, icon: Icon, badge, path }) => {
          const content = (isActive: boolean) => (
            <>
              {isActive && <span className="absolute -left-6 top-0 h-full w-[3px] rounded-r bg-gold" />}
              <Icon size={20} strokeWidth={1.6} />
              <span className="flex-1 text-left">{label}</span>
              {badge?.variant === "live" && (
                <span className="rounded bg-red-900/40 px-2 py-0.5 text-[10px] font-bold tracking-wider text-red-400 ring-1 ring-red-500/30">
                  {badge.text}
                </span>
              )}
              {badge?.variant === "count" && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs text-muted2">
                  {badge.text}
                </span>
              )}
            </>
          );

          // No page yet -> plain button that shows a toast.
          if (!path) {
            return (
              <button key={label} onClick={() => onComingSoon(label)} className={`${baseItem} ${inactiveItem}`}>
                {content(false)}
              </button>
            );
          }

          return (
            <NavLink
              key={label}
              to={path}
              end={path === "/"}
              className={({ isActive }) => `${baseItem} ${isActive ? "bg-gold/10 text-gold" : inactiveItem}`}
            >
              {({ isActive }) => content(isActive)}
            </NavLink>
          );
        })}
      </nav>

      {/* Season progress */}
      <div className="mx-6 mt-auto rounded-xl border border-line bg-card p-4">
        <div className="flex justify-between text-[10px] font-semibold tracking-[0.14em] text-muted">
          <span>SEASON PROGRESS</span>
          <span className="text-gold">22d left</span>
        </div>
        <div className="mt-2 font-display text-lg font-bold text-white">Crystal League II</div>
        <ProgressBar value={78} className="mt-2" />
        <div className="mt-2 flex justify-between text-[11px] text-muted">
          <span>2,340 pts</span>
          <span>3,000 pts</span>
        </div>
      </div>

      {/* User */}
      <div className="mt-5 flex items-center gap-3 border-t border-line px-9 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/25 text-sm font-bold text-gold-soft">W</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">Warchief</div>
          <div className="text-xs text-muted">Leader</div>
        </div>
        <MoreHorizontal size={20} className="text-muted" />
      </div>
    </aside>
  );
}
import { NavLink } from "react-router-dom";
import { ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react";
import { useClanData } from "../../../lib/ClanDataProvider";
import { navItems } from "../data/HomeData";
import { buildNavBadges, buildSeason, initialsOf } from "../data/buildHome";
import type { BadgeVariant } from "../types";
import ClanBadge from "./Clanbadge";
import ProgressBar from "./Progressbar";
import { useSettings } from "../../Settings/settingsStore";

interface Props {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenClan: () => void;
  /** Called when a nav item without a page (no `path`) is clicked. */
  onComingSoon: (label: string) => void;
}

const inactiveItem = "text-muted2 hover:bg-white/5 hover:text-white";

const BADGE_CLASS: Record<BadgeVariant, string> = {
  live: "bg-red-900/40 text-red-400 ring-1 ring-red-500/30",
  prep: "bg-amber-900/40 text-amber-400 ring-1 ring-amber-500/30",
  count: "",
};
const DOT_CLASS: Record<BadgeVariant, string> = { live: "bg-red-500", prep: "bg-amber-400", count: "bg-gold" };

export default function Sidebar({ collapsed, onToggleCollapsed, onOpenClan, onComingSoon }: Props) {
  const [settings] = useSettings();
  const { clanTag, overview, loading, error } = useClanData();

  const badges = buildNavBadges(overview);
  const season = buildSeason(overview);

  // What the clan switcher shows: live clan data, or a prompt when nothing is connected yet.
  const clan = overview?.clan ?? null;
  const clanName = clan?.name ?? (clanTag === null ? "Connect your clan" : loading ? "Loading…" : "Clan unavailable");
  const clanLine =
    clanTag === null
      ? "Tap to get started"
      : clan
        ? `Level ${clan.level ?? "?"} · ${clan.tag}`
        : error
          ? `${clanTag} · couldn't load`
          : clanTag;
  const badgeText = settings.badgeInitials.trim().toUpperCase().slice(0, 3) || (clan ? initialsOf(clan.name) : "?");
  const leaderInitial = settings.leaderName.trim().charAt(0).toUpperCase() || "?";

  const itemClass = `relative flex h-[54px] items-center rounded-lg text-[15px] font-medium transition ${
    collapsed ? "justify-center" : "gap-4 px-4"
  }`;

  return (
    <aside
      className={`relative z-30 h-screen shrink-0 transition-[width] duration-200 ${collapsed ? "w-20" : "w-[310px]"}`}
    >
      <div className="flex h-full flex-col overflow-hidden border-r border-line bg-panel">
        {/* Logo */}
        <div className={`flex items-center gap-3 pt-9 ${collapsed ? "justify-center" : "px-9"}`}>
          <ClanBadge initials="F" size={34} fill="rgba(217,169,63,0.08)" stroke="#d9a93f" />
          {!collapsed && (
            <div>
              <div className="font-display text-[22px] font-bold leading-none tracking-wide text-white">
                LEADER'S<span className="text-gold"> VALLEY</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold tracking-[0.18em] text-muted">LEADER COMMAND</div>
            </div>
          )}
        </div>

        {/* Clan switcher */}
        <button
          onClick={onOpenClan}
          title={collapsed ? clanName : undefined}
          aria-label={clanTag === null ? "Connect your clan" : `Clan: ${clanName}`}
          className={`mt-9 flex items-center rounded-xl border border-line bg-card text-left transition hover:border-gold/40 ${
            collapsed ? "mx-3 justify-center p-2" : "mx-6 gap-4 px-5 py-4"
          }`}
        >
          <ClanBadge initials={badgeText} size={38} fill="rgba(217,169,63,0.12)" stroke="#d9a93f" />
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">YOUR CLAN</div>
                <div className="truncate font-display text-xl font-bold leading-tight text-white">{clanName}</div>
                <div className="truncate text-xs text-muted">{clanLine}</div>
              </div>
              <ChevronRight size={16} className="shrink-0 text-muted" />
            </>
          )}
        </button>

        {/* Nav */}
        {collapsed ? (
          <div className="mx-6 mt-7 border-t border-line" />
        ) : (
          <div className="mt-7 px-9 text-[10px] font-semibold tracking-[0.18em] text-muted">COMMAND CENTER</div>
        )}
        <nav aria-label="Main" className={`mt-3 flex flex-col gap-1.5 ${collapsed ? "px-3" : "px-6"}`}>
          {navItems.map(({ label, icon: Icon, path }) => {
            const badge = path ? badges[path] : undefined;

            const content = (isActive: boolean) => (
              <>
                {isActive && (
                  <span
                    className={`absolute top-0 h-full w-[3px] rounded-r bg-gold ${collapsed ? "-left-3" : "-left-6"}`}
                  />
                )}
                <Icon size={20} strokeWidth={1.6} />
                {!collapsed && <span className="flex-1 text-left">{label}</span>}
                {!collapsed && badge && badge.variant !== "count" && (
                  <span
                    title={badge.title}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wider ${BADGE_CLASS[badge.variant]}`}
                  >
                    {badge.text}
                  </span>
                )}
                {!collapsed && badge?.variant === "count" && (
                  <span
                    title={badge.title}
                    className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/10 px-1.5 text-xs text-muted2"
                  >
                    {badge.text}
                  </span>
                )}
                {/* Collapsed: badges shrink to a small dot on the icon */}
                {collapsed && badge && (
                  <span className={`absolute right-2.5 top-2.5 h-2 w-2 rounded-full ${DOT_CLASS[badge.variant]}`} />
                )}
              </>
            );

            // No page yet -> plain button that shows a toast.
            if (!path) {
              return (
                <button
                  key={label}
                  onClick={() => onComingSoon(label)}
                  title={collapsed ? label : undefined}
                  className={`${itemClass} ${inactiveItem}`}
                >
                  {content(false)}
                </button>
              );
            }

            return (
              <NavLink
                key={label}
                to={path}
                end={path === "/"}
                title={collapsed ? (badge ? `${label} · ${badge.title ?? badge.text}` : label) : undefined}
                className={({ isActive }) => `${itemClass} ${isActive ? "bg-gold/10 text-gold" : inactiveItem}`}
              >
                {({ isActive }) => content(isActive)}
              </NavLink>
            );
          })}
        </nav>

        {/* Season progress — real season dates + league; hidden when collapsed or when there's no data */}
        {!collapsed && season && clan && (
          <div className="mx-6 mt-auto rounded-xl border border-line bg-card p-4">
            <div className="flex justify-between text-[10px] font-semibold tracking-[0.14em] text-muted">
              <span>SEASON PROGRESS</span>
              <span className="text-gold">{season.daysLeft}d left</span>
            </div>
            <div className="mt-2 truncate font-display text-lg font-bold text-white">{clan.warLeague ?? "Unranked"}</div>
            <ProgressBar value={season.percent} className="mt-2" />
            <div className="mt-2 flex justify-between text-[11px] text-muted">
              <span>{clan.points !== null ? `${clan.points.toLocaleString()} clan points` : ""}</span>
              <span>Ends {season.endLabel}</span>
            </div>
          </div>
        )}

        {/* User */}
        <div
          className={`flex items-center gap-3 border-t border-line py-5 ${
            collapsed ? "mt-auto justify-center" : season && clan ? "mt-5 px-9" : "mt-auto px-9"
          }`}
        >
          <div
            title={collapsed ? settings.leaderName : undefined}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/25 text-sm font-bold text-gold-soft"
          >
            {leaderInitial}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{settings.leaderName}</div>
                <div className="text-xs text-muted">Leader</div>
              </div>
              <MoreHorizontal size={20} className="shrink-0 text-muted" />
            </>
          )}
        </div>
      </div>

      {/* Collapse / expand handle, sitting on the sidebar's right edge */}
      <button
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[42px] flex h-6 w-6 items-center justify-center rounded-full border border-line bg-card text-muted2 transition hover:border-gold/40 hover:text-gold"
      >
        {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
      </button>
    </aside>
  );
}
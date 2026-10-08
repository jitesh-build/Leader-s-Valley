// import { NavLink } from "react-router-dom";
// import { ChevronRight, MoreHorizontal } from "lucide-react";
// import { navItems } from "../data/HomeData";
// import ClanBadge from "./Clanbadge";
// import ProgressBar from "./Progressbar";

// interface Props {
//   onOpenClan: () => void;
//   /** Called when a nav item without a page (no `path`) is clicked. */
//   onComingSoon: (label: string) => void;
// }

// const baseItem = "relative flex h-[54px] items-center gap-4 rounded-lg px-4 text-[15px] font-medium transition";
// const inactiveItem = "text-muted2 hover:bg-white/5 hover:text-white";

// export default function Sidebar({ onOpenClan, onComingSoon }: Props) {
//   return (
//     <aside className="flex h-screen w-[310px] shrink-0 flex-col border-r border-line bg-panel">
//       {/* Logo */}
//       <div className="flex items-center gap-3 px-9 pt-9">
//         <ClanBadge initials="F" size={34} fill="rgba(217,169,63,0.08)" stroke="#d9a93f" />
//         <div>
//           <div className="font-display text-[22px] font-bold leading-none tracking-wide text-white">
//             Leader's<span className="text-gold"> Valley</span>
//           </div>
//           <div className="mt-2 text-[10px] font-semibold tracking-[0.18em] text-muted">LEADER COMMAND</div>
//         </div>
//       </div>

//       {/* Clan switcher */}
//       <button
//         onClick={onOpenClan}
//         className="mx-6 mt-9 flex items-center gap-4 rounded-xl border border-line bg-card px-5 py-4 text-left transition hover:border-gold/40"
//       >
//         <ClanBadge initials="DX" size={38} fill="rgba(217,169,63,0.12)" stroke="#d9a93f" />
//         <div className="flex-1">
//           <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">YOUR CLAN</div>
//           <div className="font-display text-xl font-bold leading-tight text-white">Dark Exiles</div>
//           <div className="text-xs text-muted">Level 18 · #2L8Y9J</div>
//         </div>
//         <ChevronRight size={16} className="text-muted" />
//       </button>

//       {/* Nav */}
//       <div className="mt-7 px-9 text-[10px] font-semibold tracking-[0.18em] text-muted">COMMAND CENTER</div>
//       <nav className="mt-3 flex flex-col gap-1.5 px-6">
//         {navItems.map(({ label, icon: Icon, badge, path }) => {
//           const content = (isActive: boolean) => (
//             <>
//               {isActive && <span className="absolute -left-6 top-0 h-full w-[3px] rounded-r bg-gold" />}
//               <Icon size={20} strokeWidth={1.6} />
//               <span className="flex-1 text-left">{label}</span>
//               {badge?.variant === "live" && (
//                 <span className="rounded bg-red-900/40 px-2 py-0.5 text-[10px] font-bold tracking-wider text-red-400 ring-1 ring-red-500/30">
//                   {badge.text}
//                 </span>
//               )}
//               {badge?.variant === "count" && (
//                 <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs text-muted2">
//                   {badge.text}
//                 </span>
//               )}
//             </>
//           );

//           // No page yet -> plain button that shows a toast.
//           if (!path) {
//             return (
//               <button key={label} onClick={() => onComingSoon(label)} className={`${baseItem} ${inactiveItem}`}>
//                 {content(false)}
//               </button>
//             );
//           }

//           return (
//             <NavLink
//               key={label}
//               to={path}
//               end={path === "/"}
//               className={({ isActive }) => `${baseItem} ${isActive ? "bg-gold/10 text-gold" : inactiveItem}`}
//             >
//               {({ isActive }) => content(isActive)}
//             </NavLink>
//           );
//         })}
//       </nav>

//       {/* Season progress */}
//       <div className="mx-6 mt-auto rounded-xl border border-line bg-card p-4">
//         <div className="flex justify-between text-[10px] font-semibold tracking-[0.14em] text-muted">
//           <span>SEASON PROGRESS</span>
//           <span className="text-gold">22d left</span>
//         </div>
//         <div className="mt-2 font-display text-lg font-bold text-white">Crystal League II</div>
//         <ProgressBar value={78} className="mt-2" />
//         <div className="mt-2 flex justify-between text-[11px] text-muted">
//           <span>2,340 pts</span>
//           <span>3,000 pts</span>
//         </div>
//       </div>

//       {/* User */}
//       <div className="mt-5 flex items-center gap-3 border-t border-line px-9 py-5">
//         <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/25 text-sm font-bold text-gold-soft">W</div>
//         <div className="flex-1">
//           <div className="text-sm font-semibold text-white">Warchief</div>
//           <div className="text-xs text-muted">Leader</div>
//         </div>
//         <MoreHorizontal size={20} className="text-muted" />
//       </div>
//     </aside>
//   );
// }



import { NavLink } from "react-router-dom";
import { ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react";
import { navItems } from "../data/HomeData";
import ClanBadge from "./Clanbadge";
import ProgressBar from "./Progressbar";

interface Props {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenClan: () => void;
  /** Called when a nav item without a page (no `path`) is clicked. */
  onComingSoon: (label: string) => void;
}

const inactiveItem = "text-muted2 hover:bg-white/5 hover:text-white";

export default function Sidebar({ collapsed, onToggleCollapsed, onOpenClan, onComingSoon }: Props) {
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
                CLAN<span className="text-gold">FORGE</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold tracking-[0.18em] text-muted">LEADER COMMAND</div>
            </div>
          )}
        </div>

        {/* Clan switcher */}
        <button
          onClick={onOpenClan}
          title={collapsed ? "Dark Exiles" : undefined}
          className={`mt-9 flex items-center rounded-xl border border-line bg-card text-left transition hover:border-gold/40 ${
            collapsed ? "mx-3 justify-center p-2" : "mx-6 gap-4 px-5 py-4"
          }`}
        >
          <ClanBadge initials="DX" size={38} fill="rgba(217,169,63,0.12)" stroke="#d9a93f" />
          {!collapsed && (
            <>
              <div className="flex-1">
                <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">YOUR CLAN</div>
                <div className="font-display text-xl font-bold leading-tight text-white">Dark Exiles</div>
                <div className="text-xs text-muted">Level 18 · #2L8Y9J</div>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </>
          )}
        </button>

        {/* Nav */}
        {collapsed ? (
          <div className="mx-6 mt-7 border-t border-line" />
        ) : (
          <div className="mt-7 px-9 text-[10px] font-semibold tracking-[0.18em] text-muted">COMMAND CENTER</div>
        )}
        <nav className={`mt-3 flex flex-col gap-1.5 ${collapsed ? "px-3" : "px-6"}`}>
          {navItems.map(({ label, icon: Icon, badge, path }) => {
            const content = (isActive: boolean) => (
              <>
                {isActive && (
                  <span
                    className={`absolute top-0 h-full w-[3px] rounded-r bg-gold ${collapsed ? "-left-3" : "-left-6"}`}
                  />
                )}
                <Icon size={20} strokeWidth={1.6} />
                {!collapsed && <span className="flex-1 text-left">{label}</span>}
                {!collapsed && badge?.variant === "live" && (
                  <span className="rounded bg-red-900/40 px-2 py-0.5 text-[10px] font-bold tracking-wider text-red-400 ring-1 ring-red-500/30">
                    {badge.text}
                  </span>
                )}
                {!collapsed && badge?.variant === "count" && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs text-muted2">
                    {badge.text}
                  </span>
                )}
                {/* Collapsed: badges shrink to a small dot on the icon */}
                {collapsed && badge && (
                  <span
                    className={`absolute right-2.5 top-2.5 h-2 w-2 rounded-full ${
                      badge.variant === "live" ? "bg-red-500" : "bg-gold"
                    }`}
                  />
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
                title={collapsed ? label : undefined}
                className={({ isActive }) => `${itemClass} ${isActive ? "bg-gold/10 text-gold" : inactiveItem}`}
              >
                {({ isActive }) => content(isActive)}
              </NavLink>
            );
          })}
        </nav>

        {/* Season progress — hidden entirely when collapsed */}
        {!collapsed && (
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
        )}

        {/* User */}
        <div
          className={`flex items-center gap-3 border-t border-line py-5 ${
            collapsed ? "mt-auto justify-center" : "mt-5 px-9"
          }`}
        >
          <div
            title={collapsed ? "Warchief" : undefined}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/25 text-sm font-bold text-gold-soft"
          >
            W
          </div>
          {!collapsed && (
            <>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">Warchief</div>
                <div className="text-xs text-muted">Leader</div>
              </div>
              <MoreHorizontal size={20} className="text-muted" />
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
import { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ClanDataProvider, useClanData } from "../../lib/ClanDataProvider";
import { Sidebar, Toast } from "../Home/components";
import type { LayoutContext } from "./useLayoutContext";

const COLLAPSE_KEY = "sidebar-collapsed";

/** Persistent shell: Sidebar stays mounted, only <Outlet /> changes per route. */
function Shell() {
  const navigate = useNavigate();
  const { clanTag } = useClanData();
  const [toast, setToast] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Remember the sidebar state across reloads.
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* storage unavailable — ignore */
    }
  }, [collapsed]);

  const showToast = useCallback((message: string) => setToast(message), []);
  const context: LayoutContext = { showToast };

  return (
    <div className="flex h-screen overflow-hidden bg-page font-sans text-white">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        // No clan yet -> the Overview page is where you connect one; otherwise the clan settings.
        onOpenClan={() => navigate(clanTag === null ? "/" : "/settings")}
        onComingSoon={(label) => showToast(`${label} is coming soon`)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <main className="flex-1">
          <Outlet context={context} />
        </main>
      </div>

      <Toast message={toast} />
    </div>
  );
}

/** The clan's live data is loaded once here and shared by the sidebar and every page. */
export default function AppLayout() {
  return (
    <ClanDataProvider>
      <Shell />
    </ClanDataProvider>
  );
}
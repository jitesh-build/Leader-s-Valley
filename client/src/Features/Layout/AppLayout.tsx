import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar, Toast } from "../Home/components";
import type { LayoutContext } from "./useLayoutContext";

/** Persistent shell: Sidebar + TopBar stay mounted, only <Outlet /> changes per route. */
export default function AppLayout() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((message: string) => setToast(message), []);
  const context: LayoutContext = { showToast };

  return (
    <div className="flex h-screen overflow-hidden bg-page font-sans text-white">
      <Sidebar 
        onOpenClan={() => showToast("Clan settings opened")} 
        onComingSoon={(label) => showToast(`${label} is coming soon`)} 
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* <TopBar onAddMember={() => showToast("Add member dialog opened")} /> */}
        <main className="flex-1">
          <Outlet context={context} />
        </main>
      </div>

      <Toast message={toast} />
    </div>
  );
}
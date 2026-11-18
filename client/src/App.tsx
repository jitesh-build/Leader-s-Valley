import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
const AppLayout = lazy(() => import("./Features/Layout/AppLayout"));
const HomePage = lazy(() => import("./Features/Home/HomePage"));
const ClanWarPage = lazy(() => import("./Features/ClanWars/ClanWarPage"));
const MembersPage = lazy(() => import("./Features/Members/MembersPage"));
const RolesPage = lazy(() => import("./Features/Roles/RolesPage"));
const CapitalHallPage = lazy(() => import("./Features/CapitalHall/CapitalHallPage"));

import SettingsPage from "./Features/Settings/SettingsPage";

// Lazy-loaded so the CWL socket connection (opened when its module loads)
// only starts once someone actually visits /cwl.
const CWLbaseAssigner = lazy(() => import("./Features/CWL/CWLbaseAssigner"));

export default function App() {
  return (
      <Suspense fallback={<p className="p-12 text-center text-muted">Loading…</p>}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="clan-wars" element={<ClanWarPage />} />
            <Route path="cwl" element={<CWLbaseAssigner />} />
            <Route path="capital-hall" element={<CapitalHallPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
  );
}
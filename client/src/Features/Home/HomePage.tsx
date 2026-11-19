import { useState } from "react";
import { ChevronRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClanData } from "../../lib/ClanDataProvider";
import ClanTagForm from "../ClanWars/components/ClanTagForm";
import { HealthCard, StatCard, WarCard } from "./components/index";
import { buildHealth, buildStats } from "./data/buildHome";
import { useSettings } from "../Settings/settingsStore";

export default function HomePage() {
  const navigate = useNavigate();
  const [settings] = useSettings();
  const { clanTag, setClanTag, overview, loading, refreshing, error, updatedAt, refresh } = useClanData();
  const [changingClan, setChangingClan] = useState(false);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();

  const showClanForm = clanTag === null || changingClan;
  const clanName = overview?.clan.name ?? (clanTag === null ? "your clan" : settings.clanName);
  const lastUpdated = updatedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="px-12 pb-10 pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.16em] text-gold-dim">{today}</div>
          <h1 className="mt-5 font-display text-[40px] font-bold leading-none text-white">Welcome back, {settings.leaderName}.</h1>
          <p className="mt-3 text-sm text-muted">
            {clanTag === null ? (
              "Connect your clan to see live war, capital and member numbers."
            ) : (
              <>
                Here's what's happening with <strong className="text-white/90">{clanName}</strong> today.
              </>
            )}
          </p>
        </div>

        <div className="mb-1 flex items-center gap-2">
          {clanTag !== null && !changingClan && (
            <div className="flex items-center gap-1 rounded-lg border border-line bg-card py-1.5 pl-3 pr-1.5 text-xs text-muted2">
              <span className="font-semibold text-white/90">{clanTag}</span>
              <button
                type="button"
                onClick={() => setChangingClan(true)}
                className="rounded-md px-2 py-1 font-semibold transition hover:bg-white/10 hover:text-white"
              >
                Change
              </button>
              <button
                type="button"
                onClick={refresh}
                disabled={loading || refreshing}
                aria-label="Refresh clan data"
                title={lastUpdated ? `Updated ${lastUpdated}` : "Refresh"}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold transition hover:bg-white/10 hover:text-white disabled:opacity-60"
              >
                <RefreshCw size={13} className={loading || refreshing ? "animate-spin" : ""} />
                {lastUpdated ?? "Refresh"}
              </button>
            </div>
          )}
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-2.5 text-xs text-muted2 hover:text-white"
          >
            Manage clan <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {showClanForm ? (
        <div className="mt-9">
          <ClanTagForm
            initial={clanTag ?? ""}
            onSave={(tag) => {
              setClanTag(tag);
              setChangingClan(false);
            }}
            onCancel={clanTag !== null ? () => setChangingClan(false) : undefined}
          />
        </div>
      ) : (
        <>
          {error && (
            <div
              role="alert"
              className="mt-9 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-900/60 bg-red-950/30 px-5 py-3.5 text-sm text-red-200"
            >
              <span>
                {overview ? "Couldn't refresh just now — showing the last data we got. " : ""}
                {error.message}
                {error.status === 404 && " Check the clan tag with “Change”."}
                {error.status === 503 && " The server may not have its Clash of Clans key set up yet."}
              </span>
              <button
                type="button"
                onClick={refresh}
                className="rounded-lg border border-red-800/70 px-3 py-1.5 text-xs font-bold text-red-100 hover:bg-red-900/40"
              >
                Try again
              </button>
            </div>
          )}

          <div className={`${error ? "mt-5" : "mt-9"} grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4`}>
            {buildStats(overview).map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.75fr_1fr]">
            <WarCard
              overview={overview}
              loading={loading}
              warUnavailable={overview?.unavailable.includes("war") ?? false}
              onOpenWarRoom={() => navigate("/clan-wars")}
            />
            <HealthCard health={buildHealth(overview)} />
          </div>
        </>
      )}
    </div>
  );
}
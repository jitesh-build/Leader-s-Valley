import React, { useState } from "react";
import { WAR_MODE_SIZES, WarMode } from "../types";
import { OUTLINE, SOFT } from "../lib/outline";
import { BTN_GOLD, INPUT, LABEL, PANEL } from "../lib/gameStyles";
import { DIVISIONS, formatTier } from "../lib/leagues";
// import { themeForLeague, LEAGUE_BY_ID } from "../lib/leagues";
import type { Division, LeagueId } from "../lib/leagues";
// import ArenaBackground from "./ArenaBackground";
import LeagueSelect from "./LeagueSelect";

interface CreateWarFormProps {
  onCreate: (input: { name: string; mode: WarMode; size?: number; leagueTier?: string }) => Promise<void>;
  onCancel: () => void;
  /**
   * Fires whenever the chosen league changes (null = nothing chosen yet).
   * Use it to switch the page background behind this form while the user picks.
   */
  onLeagueChange?: (league: LeagueId | null) => void;
}

const MODE_OPTIONS: { mode: WarMode; label: string; hint: string }[] = [
  { mode: "5v5", label: "5 v 5", hint: "Master I or below" },
  { mode: "15v15", label: "15 v 15", hint: "Standard · all leagues" },
  { mode: "30v30", label: "30 v 30", hint: "Master I or below" },
  { mode: "custom", label: "Custom", hint: "Set your own size" },
];

export default function CreateWarForm({ onCreate, onCancel, onLeagueChange }: CreateWarFormProps): React.ReactElement {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<WarMode>("15v15");
  const [customSize, setCustomSize] = useState("15");
  const [league, setLeague] = useState<LeagueId | null>(null);
  const [division, setDivision] = useState<Division | null>(null);
  const [tierError, setTierError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickLeague(id: LeagueId): void {
    setLeague(id);
    setTierError(null);
    onLeagueChange?.(id);
  }

  function pickDivision(d: Division): void {
    setDivision(d);
    setTierError(null);
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give this war a name, e.g. \"August 2026 CWL\"");
      return;
    }
    if (!league || !division) {
      setError(null);
      setTierError(!league ? "Choose a league." : "Choose a division (I, II or III).");
      return;
    }
    setError(null);
    setTierError(null);
    setSubmitting(true);
    try {
      const size = mode === "custom" ? Number(customSize) : undefined;
      await onCreate({
        name: trimmed,
        mode,
        ...(size !== undefined ? { size } : {}),
        leagueTier: formatTier(league, division),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create war");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${PANEL} mx-auto max-w-lg bg-black/65 p-6`} noValidate>
      <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">NEW WAR</div>
      <h2 className="mb-5 mt-1 font-display text-[26px] font-bold text-white" style={OUTLINE}>
        Start a new CWL
      </h2>

      <label className="mb-4 block">
        <span className={LABEL}>SEASON / WAR NAME</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="August 2026 CWL"
          className={INPUT}
          autoFocus
        />
      </label>

      <div className="mb-4">
        <span className={LABEL}>WAR SIZE</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MODE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.mode}
              onClick={() => setMode(opt.mode)}
              className={[
                "rounded-lg border px-2 py-2.5 text-center transition",
                mode === opt.mode ? "border-gold/60 bg-gold/10" : "border-line bg-black/40 hover:border-gold/30",
              ].join(" ")}
            >
              <div className={`font-display text-sm font-bold ${mode === opt.mode ? "text-gold" : "text-white"}`}>{opt.label}</div>
              <div className="mt-0.5 text-[10px] leading-snug text-white/60">{opt.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {mode === "custom" ? (
        <label className="mb-4 block">
          <span className={LABEL}>BASES PER SIDE</span>
          <input value={customSize} onChange={(e) => setCustomSize(e.target.value)} inputMode="numeric" className={`${INPUT} !w-28`} />
        </label>
      ) : (
        <p className="mb-4 text-xs text-white/70" style={SOFT}>
          {WAR_MODE_SIZES[mode as Exclude<WarMode, "custom">]} bases per side.
        </p>
      )}

      {/* League tier (required) */}
      <div className="mb-4">
        <span className={LABEL}>LEAGUE TIER</span>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <LeagueSelect value={league} onChange={pickLeague} invalid={tierError !== null && !league} />
          </div>
          <div role="radiogroup" aria-label="Division" className="flex shrink-0 gap-1.5">
            {DIVISIONS.map((d) => {
              const active = division === d;
              return (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => pickDivision(d)}
                  className={[
                    "h-[42px] w-11 rounded-lg border text-sm font-extrabold transition",
                    active
                      ? "border-gold/60 bg-gold/10 text-gold"
                      : tierError !== null && !division
                        ? "border-red-400/70 bg-black/40 text-white hover:border-gold/30"
                        : "border-line bg-black/40 text-white hover:border-gold/30",
                  ].join(" ")}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
        {tierError ? (
          <p className="mt-1.5 text-xs font-semibold text-red-300" style={SOFT}>
            {tierError}
          </p>
        ) : null}
      </div>

      {/* Live preview of the background this league gives the war page */}
      {/* <div className="mb-5">
        <span className={LABEL}>
          BACKGROUND PREVIEW{league ? ` · ${LEAGUE_BY_ID[league].name.toUpperCase()}` : ""}
        </span>
        <div className="overflow-hidden rounded-lg border-2 border-line">
          <ArenaBackground
            theme={themeForLeague(league)}
            height={150}
            tileSize={44}
            pathWidth={24}
            wallHeight={22}
            topZoneHeight={46}
            bottomZoneHeight={6}
          />
        </div>
      </div> */}

      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2.5 text-sm text-white/70 hover:text-white">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className={`${BTN_GOLD} h-[42px] px-5 text-sm`}>
          Create war
        </button>
      </div>
    </form>
  );
}
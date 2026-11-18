import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "./api/client";
import type { StarCount, War, WarMode } from "./types";
import { useWarBoard } from "./hooks/useWarBoard";
import { socket } from "./lib/socket";
import { OUTLINE, SOFT } from "./lib/outline";
import { BTN_DARK, BTN_RED } from "./lib/gameStyles";
import { getLeagueTheme, themeForLeague } from "./lib/leagues";
import type { LeagueId } from "./lib/leagues";
import ArenaBackground from "./components/ArenaBackground";
import StatsBar from "./components/StatsBar";
import SlotBoard from "./components/SlotBoard";
import EnemyScoutPanel from "./components/EnemyScoutPanel";
import ScoutToggleButton from "./components/ScoutToggleButton";
import CreateWarForm from "./components/CreateWarForm";

// Height of the icy strips at the top / bottom of the arena. The page content is padded by the
// same amount so nothing sits on the light tiles.
const ARENA_TOP = 90;
const ARENA_BOTTOM = 110;

export default function CWLbaseAssigner(): React.ReactElement {
  const [wars, setWars] = useState<War[]>([]);
  const [warsLoading, setWarsLoading] = useState(true);
  const [warsError, setWarsError] = useState<string | null>(null);
  const [selectedWarId, setSelectedWarId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [slotErrors, setSlotErrors] = useState<Record<string, string>>({});
  // Which multi-select slot, if any, is currently "armed" to receive the
  // next enemy-base pip click as a new pool entry (see the slot card's
  // "+ new" dashed button).
  const [poolAddArmedSlotId, setPoolAddArmedSlotId] = useState<string | null>(null);
  // Enemy scouting sidebar (toggle button pinned to the right edge).
  const [showScout, setShowScout] = useState(false);
  // League currently picked inside the "new war" form — switches the page background live.
  // null = nothing picked yet, which shows the default background.
  const [previewLeague, setPreviewLeague] = useState<LeagueId | null>(null);

  async function refetchWars(): Promise<void> {
    setWarsLoading(true);
    setWarsError(null);
    try {
      const list = await api.listWars();
      setWars(list);
      if (list.length === 0) {
        setShowCreate(true);
        setSelectedWarId(null);
      } else if (!selectedWarId || !list.some((w) => w._id === selectedWarId)) {
        setSelectedWarId(list[0]?._id ?? null);
      }
    } catch (err) {
      setWarsError(err instanceof ApiError ? err.message : "Could not reach the server");
    } finally {
      setWarsLoading(false);
    }
  }

  useEffect(() => {
    void refetchWars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the war picker in sync when *any* connected client creates, renames,
  // or deletes a war — the "wars:list" room is joined automatically by every
  // socket connection server-side, no explicit join needed here.
  useEffect(() => {
    const handleWarsChanged = () => {
      void refetchWars();
    };
    socket.on("war:created", handleWarsChanged);
    socket.on("war:updated", handleWarsChanged);
    socket.on("war:deleted", handleWarsChanged);
    return () => {
      socket.off("war:created", handleWarsChanged);
      socket.off("war:updated", handleWarsChanged);
      socket.off("war:deleted", handleWarsChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If someone else deletes the war we're currently looking at, drop back to
  // the picker instead of leaving the board stuck on now-nonexistent data.
  const handleActiveWarDeletedRemotely = useCallback((): void => {
    setSelectedWarId(null);
    void refetchWars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { state, updateSlot, addEnemyBase, removeEnemyBase, autoFillRemaining, updateEnemyScout } = useWarBoard(
    selectedWarId,
    handleActiveWarDeletedRemotely
  );

  // Whenever we switch wars, drop any active slot selection.
  useEffect(() => {
    setActiveSlotId(null);
    setPoolAddArmedSlotId(null);
    setSlotErrors({});
  }, [selectedWarId]);

  // Arming only makes sense for the currently-active slot — if the selection
  // changes away from the armed slot for any reason, drop the armed state so
  // a stray later click can't silently add to the wrong slot's pool.
  useEffect(() => {
    if (poolAddArmedSlotId !== null && poolAddArmedSlotId !== activeSlotId) {
      setPoolAddArmedSlotId(null);
    }
  }, [activeSlotId, poolAddArmedSlotId]);

  // Esc closes the scouting sidebar.
  useEffect(() => {
    if (!showScout) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowScout(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showScout]);

  async function handleCreateWar(input: { name: string; mode: WarMode; size?: number; leagueTier?: string }) {
    const war = await api.createWar(input);
    await refetchWars();
    setSelectedWarId(war._id);
    setShowCreate(false);
    setPreviewLeague(null);
  }

  async function handleDeleteWar(id: string): Promise<void> {
    if (!confirm("Delete this war and all its slot assignments? This cannot be undone.")) return;
    await api.deleteWar(id);
    await refetchWars();
  }

  function clearSlotError(id: string): void {
    setSlotErrors((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function assignActiveSlot(field: "teamBaseNumber" | "enemyBaseNumber", value: number | null): Promise<void> {
    if (!activeSlotId || !selectedWarId) return;
    const { error, slots } = await updateSlot(activeSlotId, { [field]: value });
    if (error) {
      setSlotErrors((prev) => ({ ...prev, [activeSlotId]: error }));
      return;
    }
    clearSlotError(activeSlotId);

    // Auto-advance to the next fully-empty slot once this one is complete.
    // `slots` here is already the fresh, merged array from updateSlot — no
    // extra network call needed to figure out what's next.
    const justFilled = slots.find((s) => s._id === activeSlotId);
    const isComplete = justFilled && justFilled.teamBaseNumber !== null && justFilled.enemyBaseNumber !== null;
    if (isComplete) {
      const next = slots.find((s) => s.teamBaseNumber === null && s.enemyBaseNumber === null);
      setActiveSlotId(next ? next._id : null);
    }
  }

  // Enemy base pips route differently depending on whether the active slot
  // is a normal (single-target) slot or a multi-select one.
  async function handlePickEnemyBase(n: number): Promise<void> {
    if (!activeSlotId) return;
    const activeSlot = state.slots.find((s) => s._id === activeSlotId);
    if (!activeSlot) return;

    if (activeSlot.isMultiSelect) {
      // Only accept the pick while armed via the "+ new" button — StatsBar
      // already disables the pip otherwise, this is just a safety guard.
      if (poolAddArmedSlotId !== activeSlotId) return;
      const { error } = await addEnemyBase(activeSlotId, n);
      if (error) {
        setSlotErrors((prev) => ({ ...prev, [activeSlotId]: error }));
        return;
      }
      clearSlotError(activeSlotId);
      setPoolAddArmedSlotId(null);
    } else {
      await assignActiveSlot("enemyBaseNumber", n);
    }
  }

  async function handleClearEnemyBase(n: number): Promise<void> {
    if (!activeSlotId) return;
    const activeSlot = state.slots.find((s) => s._id === activeSlotId);
    if (!activeSlot) return;

    if (activeSlot.isMultiSelect) {
      const { error } = await removeEnemyBase(activeSlotId, n);
      if (error) setSlotErrors((prev) => ({ ...prev, [activeSlotId]: error }));
      else clearSlotError(activeSlotId);
    } else {
      await assignActiveSlot("enemyBaseNumber", null);
    }
  }

  async function handleSetStars(id: string, stars: StarCount): Promise<void> {
    const { error } = await updateSlot(id, { starsNeeded: stars });
    if (error) setSlotErrors((prev) => ({ ...prev, [id]: error }));
  }

  async function handleClearSlot(id: string): Promise<void> {
    const slot = state.slots.find((s) => s._id === id);
    const clearInput = slot?.isMultiSelect
      ? { teamBaseNumber: null as number | null }
      : { teamBaseNumber: null as number | null, enemyBaseNumber: null as number | null };
    const { error } = await updateSlot(id, clearInput);
    if (error) {
      setSlotErrors((prev) => ({ ...prev, [id]: error }));
      return;
    }
    // Multi-select slots keep their pool on "Clear" (clearing wipes the team
    // base like normal slots do) — remove each pool entry explicitly so the
    // slot ends up fully empty, matching the normal-slot behavior.
    if (slot?.isMultiSelect) {
      for (const n of slot.enemyBaseNumbers) {
        await removeEnemyBase(id, n);
      }
    }
    clearSlotError(id);
  }

  async function handleToggleMultiSelect(id: string): Promise<void> {
    const slot = state.slots.find((s) => s._id === id);
    if (!slot) return;
    const { error } = await updateSlot(id, { isMultiSelect: !slot.isMultiSelect });
    if (error) setSlotErrors((prev) => ({ ...prev, [id]: error }));
    else clearSlotError(id);
    if (poolAddArmedSlotId === id) setPoolAddArmedSlotId(null);
  }

  function handleArmAddEnemyBase(id: string): void {
    setActiveSlotId(id);
    setPoolAddArmedSlotId(id);
  }

  async function handleRemoveEnemyBaseChip(id: string, baseNumber: number): Promise<void> {
    const { error } = await removeEnemyBase(id, baseNumber);
    if (error) setSlotErrors((prev) => ({ ...prev, [id]: error }));
    else clearSlotError(id);
  }

  async function handleAutoFillRemaining(): Promise<void> {
    const { error, filledCount } = await autoFillRemaining();
    if (error) {
      alert(error);
      return;
    }
    if (filledCount === 0) {
      alert("Nothing to fill — no empty slots or no remaining bases left.");
    }
  }

  async function handleSetScoutStars(baseNumber: number, stars: StarCount): Promise<void> {
    await updateEnemyScout(baseNumber, stars);
  }

  // Create form open -> background follows the league being picked (default background until one is picked).
  // Otherwise -> background of the selected war's league.
  const theme = showCreate ? themeForLeague(previewLeague) : getLeagueTheme(state.war?.leagueTier);

  const boardReady = !showCreate && !warsLoading && !warsError && state.war && state.summary;

  return (
    // `height="100%"` = at least as tall as the page area; the arena then grows with the content,
    // so the background always matches the height of the page (no fixed 2400px any more).
    <ArenaBackground theme={theme} height="100%" topZoneHeight={ARENA_TOP} bottomZoneHeight={ARENA_BOTTOM}>
      <div className="relative px-6 sm:px-12" style={{ paddingTop: ARENA_TOP - 80, paddingBottom: ARENA_BOTTOM - 25 }}>
        {/* Scouting sidebar + its toggle button: pinned to the middle-right of the screen while you scroll.
            Sits at the full page width (outside the centered column) so the button hugs the right edge. */}
        {boardReady && state.war && (
          <div className="pointer-events-none sticky top-1/2 z-30 h-0">
            <div className="absolute -right-10 top-0 flex -translate-y-1/2 items-center gap-2">
              {showScout && (
                <div className="pointer-events-auto">
                  <EnemyScoutPanel
                    size={state.war.size}
                    enemyScouts={state.enemyScouts}
                    onSetStars={(n, stars) => void handleSetScoutStars(n, stars)}
                    onClose={() => setShowScout(false)}
                  />
                </div>
              )}
              <ScoutToggleButton open={showScout} onClick={() => setShowScout((v) => !v)} />
            </div>
          </div>
        )}

        <header className="mx-auto mb-8 flex max-w-6xl flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.16em] text-gold" style={OUTLINE}>
              CLAN WAR LEAGUE
            </div>
            <h1 className="mt-3 font-display text-[40px] font-bold leading-none text-white" style={OUTLINE}>
              Base assigner
            </h1>
            <p className="mt-3 text-sm text-white/90" style={SOFT}>
              Pair your bases with enemy targets and scout the enemy's weak spots.
            </p>
          </div>

          {wars.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedWarId ?? ""}
                onChange={(e) => setSelectedWarId(e.target.value || null)}
                aria-label="Select war"
                className="h-[44px] rounded-xl border-2 border-line bg-black/60 px-3 text-sm font-bold text-white shadow-lg [color-scheme:dark] backdrop-blur-sm focus:border-gold/60 focus:outline-none"
              >
                {wars.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.mode})
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setPreviewLeague(null);
                  setShowCreate(true);
                }}
                className={`${BTN_DARK} flex h-[44px] items-center gap-1.5 px-4 text-sm`}
              >
                <Plus size={16} strokeWidth={3} /> New war
              </button>
              {selectedWarId ? (
                <button
                  onClick={() => void handleDeleteWar(selectedWarId)}
                  aria-label="Delete war"
                  title="Delete this war"
                  className={`${BTN_RED} flex h-[44px] items-center gap-1.5 px-4 text-sm`}
                >
                  <Trash2 size={16} /> Delete
                </button>
              ) : null}
            </div>
          )}
        </header>

        <div className="mx-auto max-w-6xl space-y-6">
          {warsLoading ? (
            <p className="text-center font-bold text-white" style={OUTLINE}>
              Loading…
            </p>
          ) : warsError ? (
            <div className="mx-auto max-w-xl rounded-xl border-2 border-red-900/70 bg-black/65 p-4 text-center text-red-300 backdrop-blur-sm">
              {warsError}. Is the API server running on port 4000?
            </div>
          ) : showCreate ? (
            <CreateWarForm
              onCreate={handleCreateWar}
              onCancel={() => {
                setPreviewLeague(null);
                setShowCreate(wars.length === 0);
              }}
              onLeagueChange={setPreviewLeague}
            />
          ) : state.war && state.summary ? (
            <>
              {/* The bases panel floats: pinned near the top of the screen while the slots scroll beneath it. */}
              <div className="sticky top-3 z-20">
                <StatsBar
                  war={state.war}
                  summary={state.summary}
                  slots={state.slots}
                  enemyScouts={state.enemyScouts}
                  activeSlotId={activeSlotId}
                  poolAddArmedSlotId={poolAddArmedSlotId}
                  onPickTeamBase={(n) => void assignActiveSlot("teamBaseNumber", n)}
                  onClearTeamBase={() => void assignActiveSlot("teamBaseNumber", null)}
                  onPickEnemyBase={(n) => void handlePickEnemyBase(n)}
                  onClearEnemyBase={(n) => void handleClearEnemyBase(n)}
                />
              </div>

              {state.error ? (
                <div className="rounded-xl border-2 border-red-900/70 bg-black/65 p-3 text-sm font-semibold text-red-300 backdrop-blur-sm">
                  {state.error}
                </div>
              ) : null}

              <SlotBoard
                slots={state.slots}
                activeSlotId={activeSlotId}
                poolAddArmedSlotId={poolAddArmedSlotId}
                onSelectSlot={(id) =>
                  setActiveSlotId((prev) => {
                    if (prev === id) {
                      setPoolAddArmedSlotId(null);
                      return null;
                    }
                    return id;
                  })
                }
                onSetStars={(id, stars) => void handleSetStars(id, stars)}
                onClearSlot={(id) => void handleClearSlot(id)}
                onToggleMultiSelect={(id) => void handleToggleMultiSelect(id)}
                onArmAddEnemyBase={handleArmAddEnemyBase}
                onRemoveEnemyBase={(id, n) => void handleRemoveEnemyBaseChip(id, n)}
                onAutoFillRemaining={() => void handleAutoFillRemaining()}
                errorBySlotId={slotErrors}
              />
            </>
          ) : (
            <p className="text-center font-bold text-white" style={OUTLINE}>
              {state.loading ? "Loading war…" : "Select a war above."}
            </p>
          )}
        </div>
      </div>
    </ArenaBackground>
  );
}
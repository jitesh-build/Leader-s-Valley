// import React, { useCallback, useEffect, useState } from "react";
// import { api, ApiError } from "./api/client";
// import type { StarCount, War, WarMode } from "./types";
// import { useWarBoard } from "./hooks/useWarBoard";
// import { socket } from "./lib/socket";
// import StatsBar from "./components/StatsBar";
// import SlotBoard from "./components/SlotBoard";
// import EnemyScoutPanel from "./components/EnemyScoutPanel";
// import CreateWarForm from "./components/CreateWarForm";

// export default function CWLbaseAssigner(): React.ReactElement {
//   const [wars, setWars] = useState<War[]>([]);
//   const [warsLoading, setWarsLoading] = useState(true);
//   const [warsError, setWarsError] = useState<string | null>(null);
//   const [selectedWarId, setSelectedWarId] = useState<string | null>(null);
//   const [showCreate, setShowCreate] = useState(false);
//   const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
//   const [slotErrors, setSlotErrors] = useState<Record<string, string>>({});
//   // Which multi-select slot, if any, is currently "armed" to receive the
//   // next enemy-base pip click as a new pool entry (see the slot card's
//   // "+ new" dashed button).
//   const [poolAddArmedSlotId, setPoolAddArmedSlotId] = useState<string | null>(null);
 
//   async function refetchWars(): Promise<void> {
//     setWarsLoading(true);
//     setWarsError(null);
//     try {
//       const list = await api.listWars();
//       setWars(list);
//       if (list.length === 0) {
//         setShowCreate(true);
//         setSelectedWarId(null);
//       } else if (!selectedWarId || !list.some((w) => w._id === selectedWarId)) {
//         setSelectedWarId(list[0]?._id ?? null);
//       }
//     } catch (err) {
//       setWarsError(err instanceof ApiError ? err.message : "Could not reach the server");
//     } finally {
//       setWarsLoading(false);
//     }
//   }
 
//   useEffect(() => {
//     void refetchWars();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);
 
//   // Keep the war picker in sync when *any* connected client creates, renames,
//   // or deletes a war — the "wars:list" room is joined automatically by every
//   // socket connection server-side, no explicit join needed here.
//   useEffect(() => {
//     const handleWarsChanged = () => {
//       void refetchWars();
//     };
//     socket.on("war:created", handleWarsChanged);
//     socket.on("war:updated", handleWarsChanged);
//     socket.on("war:deleted", handleWarsChanged);
//     return () => {
//       socket.off("war:created", handleWarsChanged);
//       socket.off("war:updated", handleWarsChanged);
//       socket.off("war:deleted", handleWarsChanged);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);
 
//   // If someone else deletes the war we're currently looking at, drop back to
//   // the picker instead of leaving the board stuck on now-nonexistent data.
//   const handleActiveWarDeletedRemotely = useCallback((): void => {
//     setSelectedWarId(null);
//     void refetchWars();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);
 
//   const { state, updateSlot, addEnemyBase, removeEnemyBase, autoFillRemaining, updateEnemyScout } = useWarBoard(
//     selectedWarId,
//     handleActiveWarDeletedRemotely
//   );
 
//   // Whenever we switch wars, drop any active slot selection.
//   useEffect(() => {
//     setActiveSlotId(null);
//     setPoolAddArmedSlotId(null);
//     setSlotErrors({});
//   }, [selectedWarId]);
 
//   // Arming only makes sense for the currently-active slot — if the selection
//   // changes away from the armed slot for any reason, drop the armed state so
//   // a stray later click can't silently add to the wrong slot's pool.
//   useEffect(() => {
//     if (poolAddArmedSlotId !== null && poolAddArmedSlotId !== activeSlotId) {
//       setPoolAddArmedSlotId(null);
//     }
//   }, [activeSlotId, poolAddArmedSlotId]);
 
//   async function handleCreateWar(input: { name: string; mode: WarMode; size?: number; leagueTier?: string }) {
//     const war = await api.createWar(input);
//     await refetchWars();
//     setSelectedWarId(war._id);
//     setShowCreate(false);
//   }
 
//   async function handleDeleteWar(id: string): Promise<void> {
//     if (!confirm("Delete this war and all its slot assignments? This cannot be undone.")) return;
//     await api.deleteWar(id);
//     await refetchWars();
//   }
 
//   function clearSlotError(id: string): void {
//     setSlotErrors((prev) => {
//       if (!(id in prev)) return prev;
//       const next = { ...prev };
//       delete next[id];
//       return next;
//     });
//   }
 
//   async function assignActiveSlot(field: "teamBaseNumber" | "enemyBaseNumber", value: number | null): Promise<void> {
//     if (!activeSlotId || !selectedWarId) return;
//     const { error, slots } = await updateSlot(activeSlotId, { [field]: value });
//     if (error) {
//       setSlotErrors((prev) => ({ ...prev, [activeSlotId]: error }));
//       return;
//     }
//     clearSlotError(activeSlotId);
 
//     // Auto-advance to the next fully-empty slot once this one is complete.
//     // `slots` here is already the fresh, merged array from updateSlot — no
//     // extra network call needed to figure out what's next.
//     const justFilled = slots.find((s) => s._id === activeSlotId);
//     const isComplete = justFilled && justFilled.teamBaseNumber !== null && justFilled.enemyBaseNumber !== null;
//     if (isComplete) {
//       const next = slots.find((s) => s.teamBaseNumber === null && s.enemyBaseNumber === null);
//       setActiveSlotId(next ? next._id : null);
//     }
//   }
 
//   // Enemy base pips route differently depending on whether the active slot
//   // is a normal (single-target) slot or a multi-select one.
//   async function handlePickEnemyBase(n: number): Promise<void> {
//     if (!activeSlotId) return;
//     const activeSlot = state.slots.find((s) => s._id === activeSlotId);
//     if (!activeSlot) return;
 
//     if (activeSlot.isMultiSelect) {
//       // Only accept the pick while armed via the "+ new" button — StatsBar
//       // already disables the pip otherwise, this is just a safety guard.
//       if (poolAddArmedSlotId !== activeSlotId) return;
//       const { error } = await addEnemyBase(activeSlotId, n);
//       if (error) {
//         setSlotErrors((prev) => ({ ...prev, [activeSlotId]: error }));
//         return;
//       }
//       clearSlotError(activeSlotId);
//       setPoolAddArmedSlotId(null);
//     } else {
//       await assignActiveSlot("enemyBaseNumber", n);
//     }
//   }
 
//   async function handleClearEnemyBase(n: number): Promise<void> {
//     if (!activeSlotId) return;
//     const activeSlot = state.slots.find((s) => s._id === activeSlotId);
//     if (!activeSlot) return;
 
//     if (activeSlot.isMultiSelect) {
//       const { error } = await removeEnemyBase(activeSlotId, n);
//       if (error) setSlotErrors((prev) => ({ ...prev, [activeSlotId]: error }));
//       else clearSlotError(activeSlotId);
//     } else {
//       await assignActiveSlot("enemyBaseNumber", null);
//     }
//   }
 
//   async function handleSetStars(id: string, stars: StarCount): Promise<void> {
//     const { error } = await updateSlot(id, { starsNeeded: stars });
//     if (error) setSlotErrors((prev) => ({ ...prev, [id]: error }));
//   }
 
//   async function handleClearSlot(id: string): Promise<void> {
//     const slot = state.slots.find((s) => s._id === id);
//     const clearInput = slot?.isMultiSelect
//       ? { teamBaseNumber: null as number | null }
//       : { teamBaseNumber: null as number | null, enemyBaseNumber: null as number | null };
//     const { error } = await updateSlot(id, clearInput);
//     if (error) {
//       setSlotErrors((prev) => ({ ...prev, [id]: error }));
//       return;
//     }
//     // Multi-select slots keep their pool on "Clear" (clearing wipes the team
//     // base like normal slots do) — remove each pool entry explicitly so the
//     // slot ends up fully empty, matching the normal-slot behavior.
//     if (slot?.isMultiSelect) {
//       for (const n of slot.enemyBaseNumbers) {
//         await removeEnemyBase(id, n);
//       }
//     }
//     clearSlotError(id);
//   }
 
//   async function handleToggleMultiSelect(id: string): Promise<void> {
//     const slot = state.slots.find((s) => s._id === id);
//     if (!slot) return;
//     const { error } = await updateSlot(id, { isMultiSelect: !slot.isMultiSelect });
//     if (error) setSlotErrors((prev) => ({ ...prev, [id]: error }));
//     else clearSlotError(id);
//     if (poolAddArmedSlotId === id) setPoolAddArmedSlotId(null);
//   }
 
//   function handleArmAddEnemyBase(id: string): void {
//     setActiveSlotId(id);
//     setPoolAddArmedSlotId(id);
//   }
 
//   async function handleRemoveEnemyBaseChip(id: string, baseNumber: number): Promise<void> {
//     const { error } = await removeEnemyBase(id, baseNumber);
//     if (error) setSlotErrors((prev) => ({ ...prev, [id]: error }));
//     else clearSlotError(id);
//   }
 
//   async function handleAutoFillRemaining(): Promise<void> {
//     const { error, filledCount } = await autoFillRemaining();
//     if (error) {
//       alert(error);
//       return;
//     }
//     if (filledCount === 0) {
//       alert("Nothing to fill — no empty slots or no remaining bases left.");
//     }
//   }
 
//   async function handleSetScoutStars(baseNumber: number, stars: StarCount): Promise<void> {
//     await updateEnemyScout(baseNumber, stars);
//   }
 
//   return (
//     <div className="min-h-screen px-4 py-8 sm:px-8">
//       <header className="mx-auto mb-8 flex max-w-5xl flex-wrap items-center justify-between gap-4">
//         <div>
//           <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-faint">Clan War League</p>
//           <h1 className="font-display text-3xl uppercase tracking-wide text-ink-primary">Base Assigner</h1>
//         </div>
 
//         {wars.length > 0 && (
//           <div className="flex items-center gap-2">
//             <select
//               value={selectedWarId ?? ""}
//               onChange={(e) => setSelectedWarId(e.target.value || null)}
//               className="rounded border border-base-border bg-base-panel2 px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-1 focus:ring-team"
//             >
//               {wars.map((w) => (
//                 <option key={w._id} value={w._id}>
//                   {w.name} ({w.mode})
//                 </option>
//               ))}
//             </select>
//             <button
//               onClick={() => setShowCreate(true)}
//               className="rounded border border-base-border px-3 py-2 text-sm text-ink-muted transition hover:border-team hover:text-team-bright"
//             >
//               + New war
//             </button>
//             {selectedWarId ? (
//               <button
//                 onClick={() => void handleDeleteWar(selectedWarId)}
//                 className="rounded border border-base-border px-3 py-2 text-sm text-ink-faint transition hover:border-enemy hover:text-enemy-bright"
//               >
//                 Delete
//               </button>
//             ) : null}
//           </div>
//         )}
//       </header>
 
//       <main className="mx-auto max-w-5xl space-y-6">
//         {warsLoading ? (
//           <p className="text-center text-ink-faint">Loading…</p>
//         ) : warsError ? (
//           <div className="rounded-lg border border-enemy-dim bg-enemy/10 p-4 text-center text-enemy-bright">
//             {warsError}. Is the API server running on port 4000?
//           </div>
//         ) : showCreate ? (
//           <CreateWarForm onCreate={handleCreateWar} onCancel={() => setShowCreate(wars.length === 0)} />
//         ) : state.war && state.summary ? (
//           <>
//             <StatsBar
//               war={state.war}
//               summary={state.summary}
//               slots={state.slots}
//               enemyScouts={state.enemyScouts}
//               activeSlotId={activeSlotId}
//               poolAddArmedSlotId={poolAddArmedSlotId}
//               onPickTeamBase={(n) => void assignActiveSlot("teamBaseNumber", n)}
//               onClearTeamBase={() => void assignActiveSlot("teamBaseNumber", null)}
//               onPickEnemyBase={(n) => void handlePickEnemyBase(n)}
//               onClearEnemyBase={(n) => void handleClearEnemyBase(n)}
//             />
 
//             {state.error ? (
//               <div className="rounded-lg border border-enemy-dim bg-enemy/10 p-3 text-sm text-enemy-bright">
//                 {state.error}
//               </div>
//             ) : null}
 
//             <SlotBoard
//               slots={state.slots}
//               activeSlotId={activeSlotId}
//               poolAddArmedSlotId={poolAddArmedSlotId}
//               onSelectSlot={(id) =>
//                 setActiveSlotId((prev) => {
//                   if (prev === id) {
//                     setPoolAddArmedSlotId(null);
//                     return null;
//                   }
//                   return id;
//                 })
//               }
//               onSetStars={(id, stars) => void handleSetStars(id, stars)}
//               onClearSlot={(id) => void handleClearSlot(id)}
//               onToggleMultiSelect={(id) => void handleToggleMultiSelect(id)}
//               onArmAddEnemyBase={handleArmAddEnemyBase}
//               onRemoveEnemyBase={(id, n) => void handleRemoveEnemyBaseChip(id, n)}
//               onAutoFillRemaining={() => void handleAutoFillRemaining()}
//               errorBySlotId={slotErrors}
//             />
 
//             <EnemyScoutPanel
//               size={state.war.size}
//               enemyScouts={state.enemyScouts}
//               onSetStars={(n, stars) => void handleSetScoutStars(n, stars)}
//             />
//           </>
//         ) : (
//           <p className="text-center text-ink-faint">{state.loading ? "Loading war…" : "Select a war above."}</p>
//         )}
//       </main>
//     </div>
//   );
// }




import React, { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api/client";
import type { StarCount, War, WarMode } from "./types";
import { useWarBoard } from "./hooks/useWarBoard";
import { socket } from "./lib/socket";
import StatsBar from "./components/StatsBar";
import SlotBoard from "./components/SlotBoard";
import EnemyScoutPanel from "./components/EnemyScoutPanel";
import CreateWarForm from "./components/CreateWarForm";

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
 
  async function handleCreateWar(input: { name: string; mode: WarMode; size?: number; leagueTier?: string }) {
    const war = await api.createWar(input);
    await refetchWars();
    setSelectedWarId(war._id);
    setShowCreate(false);
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
 
  return (
    <div className="px-6 py-8 sm:px-12">
      <header className="mx-auto mb-8 flex max-w-5xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-faint">Clan War League</p>
          <h1 className="font-display text-3xl uppercase tracking-wide text-ink-primary">Base Assigner</h1>
        </div>
 
        {wars.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedWarId ?? ""}
              onChange={(e) => setSelectedWarId(e.target.value || null)}
              className="rounded border border-base-border bg-base-panel2 px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-1 focus:ring-team"
            >
              {wars.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} ({w.mode})
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded border border-base-border px-3 py-2 text-sm text-ink-muted transition hover:border-team hover:text-team-bright"
            >
              + New war
            </button>
            {selectedWarId ? (
              <button
                onClick={() => void handleDeleteWar(selectedWarId)}
                className="rounded border border-base-border px-3 py-2 text-sm text-ink-faint transition hover:border-enemy hover:text-enemy-bright"
              >
                Delete
              </button>
            ) : null}
          </div>
        )}
      </header>
 
      <div className="mx-auto max-w-5xl space-y-6">
        {warsLoading ? (
          <p className="text-center text-ink-faint">Loading…</p>
        ) : warsError ? (
          <div className="rounded-lg border border-enemy-dim bg-enemy/10 p-4 text-center text-enemy-bright">
            {warsError}. Is the API server running on port 4000?
          </div>
        ) : showCreate ? (
          <CreateWarForm onCreate={handleCreateWar} onCancel={() => setShowCreate(wars.length === 0)} />
        ) : state.war && state.summary ? (
          <>
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
 
            {state.error ? (
              <div className="rounded-lg border border-enemy-dim bg-enemy/10 p-3 text-sm text-enemy-bright">
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
 
            <EnemyScoutPanel
              size={state.war.size}
              enemyScouts={state.enemyScouts}
              onSetStars={(n, stars) => void handleSetScoutStars(n, stars)}
            />
          </>
        ) : (
          <p className="text-center text-ink-faint">{state.loading ? "Loading war…" : "Select a war above."}</p>
        )}
      </div>
    </div>
  );
}
// import React, { useEffect, useState } from "react";
// import { api, ApiError } from "./api/client";
// import type { StarCount, War, WarMode } from "./types";
// import { useWarBoard } from "./hooks/useWarBoard";
// import StatsBar from "./components/StatsBar";
// import SlotBoard from "./components/SlotBoard";
// import EnemyScoutPanel from "./components/EnemyScoutPanel";
// import CreateWarForm from "./components/CreateWarForm";

// export default function App(): React.ReactElement {
//   const [wars, setWars] = useState<War[]>([]);
//   const [warsLoading, setWarsLoading] = useState(true);
//   const [warsError, setWarsError] = useState<string | null>(null);
//   const [selectedWarId, setSelectedWarId] = useState<string | null>(null);
//   const [showCreate, setShowCreate] = useState(false);
//   const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
//   const [slotErrors, setSlotErrors] = useState<Record<string, string>>({});

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

//   const { state, updateSlot, updateEnemyScout } = useWarBoard(selectedWarId);

//   // Whenever we switch wars, drop any active slot selection.
//   useEffect(() => {
//     setActiveSlotId(null);
//     setSlotErrors({});
//   }, [selectedWarId]);

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
//     const err = await updateSlot(activeSlotId, { [field]: value });
//     if (err) {
//       setSlotErrors((prev) => ({ ...prev, [activeSlotId]: err }));
//       return;
//     }
//     clearSlotError(activeSlotId);

//     // Auto-advance to the next fully-empty slot once this one is complete.
//     const fresh = await api.listSlots(selectedWarId);
//     const justFilled = fresh.find((s) => s._id === activeSlotId);
//     const isComplete = justFilled && justFilled.teamBaseNumber !== null && justFilled.enemyBaseNumber !== null;
//     if (isComplete) {
//       const next = fresh.find((s) => s.teamBaseNumber === null && s.enemyBaseNumber === null);
//       setActiveSlotId(next ? next._id : null);
//     }
//   }

//   async function handleSetStars(id: string, stars: StarCount): Promise<void> {
//     const err = await updateSlot(id, { starsNeeded: stars });
//     if (err) setSlotErrors((prev) => ({ ...prev, [id]: err }));
//   }

//   async function handleClearSlot(id: string): Promise<void> {
//     const err = await updateSlot(id, { teamBaseNumber: null, enemyBaseNumber: null });
//     if (err) setSlotErrors((prev) => ({ ...prev, [id]: err }));
//     else clearSlotError(id);
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
//               onPickTeamBase={(n) => void assignActiveSlot("teamBaseNumber", n)}
//               onClearTeamBase={() => void assignActiveSlot("teamBaseNumber", null)}
//               onPickEnemyBase={(n) => void assignActiveSlot("enemyBaseNumber", n)}
//               onClearEnemyBase={() => void assignActiveSlot("enemyBaseNumber", null)}
//             />

//             {state.error ? (
//               <div className="rounded-lg border border-enemy-dim bg-enemy/10 p-3 text-sm text-enemy-bright">
//                 {state.error}
//               </div>
//             ) : null}

//             <SlotBoard
//               slots={state.slots}
//               activeSlotId={activeSlotId}
//               onSelectSlot={(id) => setActiveSlotId((prev) => (prev === id ? null : id))}
//               onSetStars={(id, stars) => void handleSetStars(id, stars)}
//               onClearSlot={(id) => void handleClearSlot(id)}
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




import React, { useEffect, useState } from "react";
import { api, ApiError } from "./api/client";
import type { StarCount, War, WarMode } from "./types";
import { useWarBoard } from "./hooks/useWarBoard";
import StatsBar from "./components/StatsBar";
import SlotBoard from "./components/SlotBoard";
import EnemyScoutPanel from "./components/EnemyScoutPanel";
import CreateWarForm from "./components/CreateWarForm";

export default function App(): React.ReactElement {
  const [wars, setWars] = useState<War[]>([]);
  const [warsLoading, setWarsLoading] = useState(true);
  const [warsError, setWarsError] = useState<string | null>(null);
  const [selectedWarId, setSelectedWarId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [slotErrors, setSlotErrors] = useState<Record<string, string>>({});

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

  const { state, updateSlot, updateEnemyScout } = useWarBoard(selectedWarId);

  // Whenever we switch wars, drop any active slot selection.
  useEffect(() => {
    setActiveSlotId(null);
    setSlotErrors({});
  }, [selectedWarId]);

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

  async function handleSetStars(id: string, stars: StarCount): Promise<void> {
    const { error } = await updateSlot(id, { starsNeeded: stars });
    if (error) setSlotErrors((prev) => ({ ...prev, [id]: error }));
  }

  async function handleClearSlot(id: string): Promise<void> {
    const { error } = await updateSlot(id, { teamBaseNumber: null, enemyBaseNumber: null });
    if (error) setSlotErrors((prev) => ({ ...prev, [id]: error }));
    else clearSlotError(id);
  }

  async function handleSetScoutStars(baseNumber: number, stars: StarCount): Promise<void> {
    await updateEnemyScout(baseNumber, stars);
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
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

      <main className="mx-auto max-w-5xl space-y-6">
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
              onPickTeamBase={(n) => void assignActiveSlot("teamBaseNumber", n)}
              onClearTeamBase={() => void assignActiveSlot("teamBaseNumber", null)}
              onPickEnemyBase={(n) => void assignActiveSlot("enemyBaseNumber", n)}
              onClearEnemyBase={() => void assignActiveSlot("enemyBaseNumber", null)}
            />

            {state.error ? (
              <div className="rounded-lg border border-enemy-dim bg-enemy/10 p-3 text-sm text-enemy-bright">
                {state.error}
              </div>
            ) : null}

            <SlotBoard
              slots={state.slots}
              activeSlotId={activeSlotId}
              onSelectSlot={(id) => setActiveSlotId((prev) => (prev === id ? null : id))}
              onSetStars={(id, stars) => void handleSetStars(id, stars)}
              onClearSlot={(id) => void handleClearSlot(id)}
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
      </main>
    </div>
  );
}
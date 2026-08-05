// import { useCallback, useEffect, useState } from "react";
// import { api, ApiError } from "../api/client";
// import type { EnemyScout, Slot, StarCount, War, WarSummary } from "../types";

// interface WarBoardState {
//   war: War | null;
//   summary: WarSummary | null;
//   slots: Slot[];
//   enemyScouts: EnemyScout[];
//   loading: boolean;
//   error: string | null;
// }

// export function useWarBoard(warId: string | null): {
//   state: WarBoardState;
//   refetch: () => Promise<void>;
//   updateSlot: (
//     id: string,
//     input: Partial<{ teamBaseNumber: number | null; enemyBaseNumber: number | null; starsNeeded: StarCount }>
//   ) => Promise<string | null>;
//   updateEnemyScout: (baseNumber: number, expectedStars: StarCount) => Promise<string | null>;
// } {
//   const [state, setState] = useState<WarBoardState>({
//     war: null,
//     summary: null,
//     slots: [],
//     enemyScouts: [],
//     loading: false,
//     error: null,
//   });

//   const refetch = useCallback(async () => {
//     if (!warId) {
//       setState({ war: null, summary: null, slots: [], enemyScouts: [], loading: false, error: null });
//       return;
//     }
//     setState((prev) => ({ ...prev, loading: true, error: null }));
//     try {
//       const [war, summary, slots, enemyScouts] = await Promise.all([
//         api.getWar(warId),
//         api.getWarSummary(warId),
//         api.listSlots(warId),
//         api.listEnemyScouts(warId),
//       ]);
//       setState({ war, summary, slots, enemyScouts, loading: false, error: null });
//     } catch (err) {
//       const message = err instanceof ApiError ? err.message : "Failed to load war data";
//       setState((prev) => ({ ...prev, loading: false, error: message }));
//     }
//   }, [warId]);

//   useEffect(() => {
//     void refetch();
//   }, [refetch]);

//   const updateSlot = useCallback(
//     async (
//       id: string,
//       input: Partial<{ teamBaseNumber: number | null; enemyBaseNumber: number | null; starsNeeded: StarCount }>
//     ): Promise<string | null> => {
//       try {
//         await api.updateSlot(id, input);
//         await refetch();
//         return null;
//       } catch (err) {
//         return err instanceof ApiError ? err.message : "Failed to update slot";
//       }
//     },
//     [refetch]
//   );

//   const updateEnemyScout = useCallback(
//     async (baseNumber: number, expectedStars: StarCount): Promise<string | null> => {
//       if (!warId) return "No war selected";
//       try {
//         await api.updateEnemyScout(warId, baseNumber, expectedStars);
//         await refetch();
//         return null;
//       } catch (err) {
//         return err instanceof ApiError ? err.message : "Failed to update scouting";
//       }
//     },
//     [warId, refetch]
//   );

//   return { state, refetch, updateSlot, updateEnemyScout };
// }


import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import type { EnemyScout, Slot, StarCount, War, WarSummary } from "../types";

interface WarBoardState {
  war: War | null;
  summary: WarSummary | null;
  slots: Slot[];
  enemyScouts: EnemyScout[];
  loading: boolean;
  error: string | null;
}

/** Mirrors the backend's /wars/:id/summary calculation, done client-side so a
 *  single slot update doesn't need to round-trip to the server for fresh counts. */
function computeSummary(war: War, slots: Slot[]): WarSummary {
  const teamAssigned = slots.filter((s) => typeof s.teamBaseNumber === "number").length;
  const enemyAssigned = slots.filter((s) => typeof s.enemyBaseNumber === "number").length;
  return {
    size: war.size,
    slotCount: slots.length,
    teamBasesTotal: war.size,
    teamBasesAssigned: teamAssigned,
    teamBasesAvailable: war.size - teamAssigned,
    enemyBasesTotal: war.size,
    enemyBasesAssigned: enemyAssigned,
    enemyBasesAvailable: war.size - enemyAssigned,
  };
}

export function useWarBoard(warId: string | null): {
  state: WarBoardState;
  refetch: () => Promise<void>;
  updateSlot: (
    id: string,
    input: Partial<{ teamBaseNumber: number | null; enemyBaseNumber: number | null; starsNeeded: StarCount }>
  ) => Promise<{ error: string | null; slots: Slot[] }>;
  updateEnemyScout: (baseNumber: number, expectedStars: StarCount) => Promise<string | null>;
} {
  const [state, setState] = useState<WarBoardState>({
    war: null,
    summary: null,
    slots: [],
    enemyScouts: [],
    loading: false,
    error: null,
  });

  // Kept in sync with state so mutation handlers can read/merge the *current*
  // slots/scouts/war synchronously, without waiting on a React re-render.
  const slotsRef = useRef<Slot[]>([]);
  const enemyScoutsRef = useRef<EnemyScout[]>([]);

  useEffect(() => {
    slotsRef.current = state.slots;
    enemyScoutsRef.current = state.enemyScouts;
  }, [state.slots, state.enemyScouts]);

  const refetch = useCallback(async () => {
    if (!warId) {
      setState({ war: null, summary: null, slots: [], enemyScouts: [], loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [war, summary, slots, enemyScouts] = await Promise.all([
        api.getWar(warId),
        api.getWarSummary(warId),
        api.listSlots(warId),
        api.listEnemyScouts(warId),
      ]);
      setState({ war, summary, slots, enemyScouts, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load war data";
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [warId]);

  // Full refetch only happens once, on initial load / war switch — not on
  // every slot or scout mutation.
  useEffect(() => {
    void refetch();
  }, [refetch]);

  const updateSlot = useCallback(
    async (
      id: string,
      input: Partial<{ teamBaseNumber: number | null; enemyBaseNumber: number | null; starsNeeded: StarCount }>
    ): Promise<{ error: string | null; slots: Slot[] }> => {
      try {
        const updated = await api.updateSlot(id, input);
        const newSlots = slotsRef.current.map((s) => (s._id === id ? updated : s));
        slotsRef.current = newSlots;
        setState((prev) => ({
          ...prev,
          slots: newSlots,
          summary: prev.war ? computeSummary(prev.war, newSlots) : prev.summary,
          error: null,
        }));
        return { error: null, slots: newSlots };
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to update slot";
        setState((prev) => ({ ...prev, error: message }));
        return { error: message, slots: slotsRef.current };
      }
    },
    []
  );

  const updateEnemyScout = useCallback(
    async (baseNumber: number, expectedStars: StarCount): Promise<string | null> => {
      if (!warId) return "No war selected";
      try {
        const updated = await api.updateEnemyScout(warId, baseNumber, expectedStars);
        const newScouts = enemyScoutsRef.current.map((s) => (s.baseNumber === baseNumber ? updated : s));
        enemyScoutsRef.current = newScouts;
        setState((prev) => ({ ...prev, enemyScouts: newScouts, error: null }));
        return null;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to update scouting";
        setState((prev) => ({ ...prev, error: message }));
        return message;
      }
    },
    [warId]
  );

  return { state, refetch, updateSlot, updateEnemyScout };
}
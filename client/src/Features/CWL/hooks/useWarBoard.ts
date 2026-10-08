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
import { socket } from "../lib/socket";
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
 *  single slot update doesn't need to round-trip to the server for fresh counts.
 *  An enemy base counts as "assigned" whether it's a normal slot's single
 *  target or sitting in one (or several) multi-select pools — dedupe by base
 *  number since multi-select pools can legitimately overlap. */
function computeSummary(war: War, slots: Slot[]): WarSummary {
  const teamAssigned = slots.filter((s) => typeof s.teamBaseNumber === "number").length;

  const enemyBaseSet = new Set<number>();
  for (const s of slots) {
    if (typeof s.enemyBaseNumber === "number") enemyBaseSet.add(s.enemyBaseNumber);
    for (const n of s.enemyBaseNumbers ?? []) enemyBaseSet.add(n);
  }

  return {
    size: war.size,
    slotCount: slots.length,
    teamBasesTotal: war.size,
    teamBasesAssigned: teamAssigned,
    teamBasesAvailable: war.size - teamAssigned,
    enemyBasesTotal: war.size,
    enemyBasesAssigned: enemyBaseSet.size,
    enemyBasesAvailable: war.size - enemyBaseSet.size,
  };
}

export function useWarBoard(
  warId: string | null,
  /** Fires if another client deletes the war currently being viewed, so the
   *  caller (App) can clear the selection and refetch the war list. */
  onWarDeletedRemotely?: () => void
): {
  state: WarBoardState;
  refetch: () => Promise<void>;
  updateSlot: (
    id: string,
    input: Partial<{
      teamBaseNumber: number | null;
      enemyBaseNumber: number | null;
      starsNeeded: StarCount;
      isMultiSelect: boolean;
    }>
  ) => Promise<{ error: string | null; slots: Slot[] }>;
  addEnemyBase: (slotId: string, baseNumber: number) => Promise<{ error: string | null; slots: Slot[] }>;
  removeEnemyBase: (slotId: string, baseNumber: number) => Promise<{ error: string | null; slots: Slot[] }>;
  autoFillRemaining: () => Promise<{ error: string | null; filledCount: number }>;
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

  // Kept in sync with state so mutation handlers (local AND remote/socket)
  // can read/merge the *current* slots/scouts synchronously, without
  // waiting on a React re-render.
  const slotsRef = useRef<Slot[]>([]);
  const enemyScoutsRef = useRef<EnemyScout[]>([]);
  const warRef = useRef<War | null>(null);

  useEffect(() => {
    slotsRef.current = state.slots;
    enemyScoutsRef.current = state.enemyScouts;
    warRef.current = state.war;
  }, [state.slots, state.enemyScouts, state.war]);

  // The caller (App) passes an inline callback that's a new function
  // reference on every render. Stash it in a ref so the socket-subscription
  // effect below can call the *latest* version without needing it in its
  // dependency array — otherwise that effect tears down and re-subscribes
  // on every single render (including the renders caused by socket events
  // themselves), which can drop an event that arrives mid-resubscribe.
  const onWarDeletedRef = useRef(onWarDeletedRemotely);
  useEffect(() => {
    onWarDeletedRef.current = onWarDeletedRemotely;
  }, [onWarDeletedRemotely]);

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

  // --- Realtime sync -------------------------------------------------------
  useEffect(() => {
    if (!warId) return;

    const join = () => {
      socket.emit("war:join", warId);
    };
    join();

    const handleSlotUpdated = (incoming: Slot) => {
      setState((prev) => {
        const exists = prev.slots.some((s) => s._id === incoming._id);
        const newSlots = exists
          ? prev.slots.map((s) => (s._id === incoming._id ? incoming : s))
          : [...prev.slots, incoming].sort((a, b) => a.index - b.index);
        slotsRef.current = newSlots;
        return {
          ...prev,
          slots: newSlots,
          summary: prev.war ? computeSummary(prev.war, newSlots) : prev.summary,
        };
      });
    };

    const handleScoutUpdated = (incoming: EnemyScout) => {
      setState((prev) => {
        const newScouts = prev.enemyScouts.map((s) => (s.baseNumber === incoming.baseNumber ? incoming : s));
        enemyScoutsRef.current = newScouts;
        return { ...prev, enemyScouts: newScouts };
      });
    };

    const handleWarUpdated = (incoming: War) => {
      if (incoming._id !== warId) return;
      setState((prev) => ({ ...prev, war: incoming }));
    };

    const handleWarDeleted = (payload: { warId: string }) => {
      if (payload.warId !== warId) return;
      onWarDeletedRef.current?.();
    };

    // Room membership lives on the socket connection, so a dropped/reconnected
    // socket needs to rejoin explicitly.
    socket.on("connect", join);
    socket.on("slot:updated", handleSlotUpdated);
    socket.on("scout:updated", handleScoutUpdated);
    socket.on("war:updated", handleWarUpdated);
    socket.on("war:deleted", handleWarDeleted);

    return () => {
      socket.emit("war:leave", warId);
      socket.off("connect", join);
      socket.off("slot:updated", handleSlotUpdated);
      socket.off("scout:updated", handleScoutUpdated);
      socket.off("war:updated", handleWarUpdated);
      socket.off("war:deleted", handleWarDeleted);
    };
    // Deliberately NOT depending on onWarDeletedRemotely (see ref above) —
    // only re-join/re-subscribe when the viewed war actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warId]);

  const updateSlot = useCallback(
    async (
      id: string,
      input: Partial<{
        teamBaseNumber: number | null;
        enemyBaseNumber: number | null;
        starsNeeded: StarCount;
        isMultiSelect: boolean;
      }>
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

  const addEnemyBase = useCallback(
    async (slotId: string, baseNumber: number): Promise<{ error: string | null; slots: Slot[] }> => {
      try {
        const updated = await api.addEnemyBaseToSlot(slotId, baseNumber);
        const newSlots = slotsRef.current.map((s) => (s._id === slotId ? updated : s));
        slotsRef.current = newSlots;
        setState((prev) => ({
          ...prev,
          slots: newSlots,
          summary: prev.war ? computeSummary(prev.war, newSlots) : prev.summary,
          error: null,
        }));
        return { error: null, slots: newSlots };
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to add enemy base";
        setState((prev) => ({ ...prev, error: message }));
        return { error: message, slots: slotsRef.current };
      }
    },
    []
  );

  const removeEnemyBase = useCallback(
    async (slotId: string, baseNumber: number): Promise<{ error: string | null; slots: Slot[] }> => {
      try {
        const updated = await api.removeEnemyBaseFromSlot(slotId, baseNumber);
        const newSlots = slotsRef.current.map((s) => (s._id === slotId ? updated : s));
        slotsRef.current = newSlots;
        setState((prev) => ({
          ...prev,
          slots: newSlots,
          summary: prev.war ? computeSummary(prev.war, newSlots) : prev.summary,
          error: null,
        }));
        return { error: null, slots: newSlots };
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to remove enemy base";
        setState((prev) => ({ ...prev, error: message }));
        return { error: message, slots: slotsRef.current };
      }
    },
    []
  );

  const autoFillRemaining = useCallback(async (): Promise<{ error: string | null; filledCount: number }> => {
    if (!warId) return { error: "No war selected", filledCount: 0 };
    try {
      const updatedSlots = await api.autoFillRemaining(warId);
      if (updatedSlots.length === 0) {
        return { error: null, filledCount: 0 };
      }
      const updatedById = new Map(updatedSlots.map((s) => [s._id, s]));
      const newSlots = slotsRef.current.map((s) => updatedById.get(s._id) ?? s);
      slotsRef.current = newSlots;
      setState((prev) => ({
        ...prev,
        slots: newSlots,
        summary: prev.war ? computeSummary(prev.war, newSlots) : prev.summary,
        error: null,
      }));
      return { error: null, filledCount: updatedSlots.length };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to auto-fill remaining slots";
      setState((prev) => ({ ...prev, error: message }));
      return { error: message, filledCount: 0 };
    }
  }, [warId]);

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

  return { state, refetch, updateSlot, addEnemyBase, removeEnemyBase, autoFillRemaining, updateEnemyScout };
}
import { useCallback, useEffect, useState } from "react";
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

export function useWarBoard(warId: string | null): {
  state: WarBoardState;
  refetch: () => Promise<void>;
  updateSlot: (
    id: string,
    input: Partial<{ teamBaseNumber: number | null; enemyBaseNumber: number | null; starsNeeded: StarCount }>
  ) => Promise<string | null>;
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

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const updateSlot = useCallback(
    async (
      id: string,
      input: Partial<{ teamBaseNumber: number | null; enemyBaseNumber: number | null; starsNeeded: StarCount }>
    ): Promise<string | null> => {
      try {
        await api.updateSlot(id, input);
        await refetch();
        return null;
      } catch (err) {
        return err instanceof ApiError ? err.message : "Failed to update slot";
      }
    },
    [refetch]
  );

  const updateEnemyScout = useCallback(
    async (baseNumber: number, expectedStars: StarCount): Promise<string | null> => {
      if (!warId) return "No war selected";
      try {
        await api.updateEnemyScout(warId, baseNumber, expectedStars);
        await refetch();
        return null;
      } catch (err) {
        return err instanceof ApiError ? err.message : "Failed to update scouting";
      }
    },
    [warId, refetch]
  );

  return { state, refetch, updateSlot, updateEnemyScout };
}

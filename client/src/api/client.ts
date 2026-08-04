import type { EnemyScout, Slot, StarCount, War, WarMode, WarSummary } from "../types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data: unknown = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}

export const api = {
  listWars: (): Promise<War[]> => request<War[]>("/wars"),

  createWar: (input: { name: string; mode: WarMode; size?: number; leagueTier?: string }): Promise<War> =>
    request<War>("/wars", { method: "POST", body: JSON.stringify(input) }),

  getWar: (id: string): Promise<War> => request<War>(`/wars/${id}`),

  getWarSummary: (id: string): Promise<WarSummary> => request<WarSummary>(`/wars/${id}/summary`),

  deleteWar: (id: string): Promise<void> => request<void>(`/wars/${id}`, { method: "DELETE" }),

  listSlots: (warId: string): Promise<Slot[]> => request<Slot[]>(`/wars/${warId}/slots`),

  updateSlot: (
    id: string,
    input: Partial<{ teamBaseNumber: number | null; enemyBaseNumber: number | null; starsNeeded: StarCount }>
  ): Promise<Slot> => request<Slot>(`/slots/${id}`, { method: "PATCH", body: JSON.stringify(input) }),

  listEnemyScouts: (warId: string): Promise<EnemyScout[]> =>
    request<EnemyScout[]>(`/wars/${warId}/enemy-scouts`),

  updateEnemyScout: (warId: string, baseNumber: number, expectedStars: StarCount): Promise<EnemyScout> =>
    request<EnemyScout>(`/wars/${warId}/enemy-scouts/${baseNumber}`, {
      method: "PATCH",
      body: JSON.stringify({ expectedStars }),
    }),
};

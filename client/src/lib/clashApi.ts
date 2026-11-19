/**
 * Client for THIS site's own backend (`/api/clash/...`).
 * The Clash of Clans API key stays on the server — the browser never sees it.
 */

const API_BASE: string = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/clash${path}`, signal ? { signal } : {});
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "Can't reach the server. It may be waking up — try again in a moment.");
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

/** Valid tag characters in Clash of Clans. */
const TAG_RE = /^#?[0289PYLQGRJCUV]{3,15}$/;

/** "2pp0jccl" / "#2PP0JCCL" / "#2PPOJCCL" (letter O) -> "#2PP0JCCL". null if it can't be a clan tag. */
export function parseClanTag(input: string): string | null {
  const t = input.trim().toUpperCase().replace(/O/g, "0");
  if (!TAG_RE.test(t)) return null;
  return t.startsWith("#") ? t : `#${t}`;
}

// ---- Response shapes of the backend's /api/clash routes (only what the site reads) ----

export interface ApiWarAttack {
  defenderTag: string;
  stars: number;
  destructionPercentage: number;
  order: number;
}

export interface ApiWarMember {
  tag: string;
  name: string;
  townHallLevel: number | null;
  mapPosition: number;
  attacks: ApiWarAttack[];
  opponentAttacks: number;
}

export interface ApiWarSide {
  tag: string | null;
  name: string | null;
  badge: string | null;
  level: number | null;
  attacks: number;
  stars: number;
  destructionPercentage: number;
  members: ApiWarMember[];
}

export interface ApiWar {
  /** "preparation" | "inWar" | "warEnded" */
  state: string;
  teamSize: number | null;
  attacksPerMember: number | null;
  preparationStartTime: string | null;
  startTime: string | null;
  endTime: string | null;
  clan: ApiWarSide;
  opponent: ApiWarSide;
}

/** The backend answers `{ state: "notInWar" }` when there is no war. */
export type ApiWarResponse = ApiWar | { state: "notInWar" };

export interface ApiCwlCurrent {
  season: string | null;
  groupState: string | null;
  round: number | null;
  war: ApiWarResponse | null;
}

export function isActiveWar(w: ApiWarResponse): w is ApiWar {
  return "clan" in w;
}

/** One war as the Home page shows it (regular war, or our war in the newest CWL round). */
export interface ApiOverviewWar {
  kind: "war" | "cwl";
  round: number | null;
  /** "preparation" | "inWar" | "warEnded" */
  state: string;
  teamSize: number;
  attacksPerMember: number;
  preparationStartTime: string | null;
  startTime: string | null;
  endTime: string | null;
  us: { tag: string | null; name: string | null; badge: string | null; stars: number; attacks: number; destructionPercentage: number };
  them: { tag: string | null; name: string | null; badge: string | null; stars: number; attacks: number; destructionPercentage: number };
}

export interface ApiHealthMetric {
  id: string;
  label: string;
  /** 0-100, or null when the game doesn't give us the data right now. */
  value: number | null;
  detail: string;
}

/** Everything the Home page and the sidebar need — from GET /api/clash/clans/:tag/overview. */
export interface ApiOverview {
  fetchedAt: string;
  clan: {
    tag: string;
    name: string;
    description: string;
    badge: string | null;
    level: number | null;
    points: number | null;
    memberCount: number;
    isWarLogPublic: boolean;
    war: { frequency: string | null; wins: number; ties: number; losses: number; winStreak: number };
    /** e.g. "Crystal League II" (null when unranked) */
    warLeague: string | null;
    /** e.g. "Crystal II" (null when unranked) */
    leagueTier: string | null;
  };
  members: {
    total: number;
    averageTownHall: number | null;
    donatingMembers: number;
    roles: { leader: number; coLeader: number; elder: number; member: number };
  };
  capital: { hallLevel: number | null; districtCount: number; league: string | null; points: number | null };
  raid: {
    state: string | null;
    startTime: string | null;
    endTime: string | null;
    attacksUsed: number;
    attackLimit: number;
    totalLoot: number;
  } | null;
  war: ApiOverviewWar | null;
  cwl: { state: string | null; season: string | null; round: number | null; roundsStarted: number } | null;
  /** The current Gold Pass season, used as "the season". */
  season: { startTime: string | null; endTime: string | null } | null;
  health: { score: number | null; metrics: ApiHealthMetric[] };
  /** Parts that could not be loaded: "war" (private war log), "raid", "cwl", "season". */
  unavailable: string[];
}

const tagPath = (tag: string): string => `/clans/${encodeURIComponent(tag)}`;

export const clashApi = {
  /** Clan, members, capital, war, CWL, season and health in one request. */
  getOverview: (tag: string, signal?: AbortSignal) => request<ApiOverview>(`${tagPath(tag)}/overview`, signal),
  /** The regular clan war happening now. */
  getCurrentWar: (tag: string, signal?: AbortSignal) => request<ApiWarResponse>(`${tagPath(tag)}/war`, signal),
  /** The clan's war in the newest Clan War League round. */
  getCwlCurrent: (tag: string, signal?: AbortSignal) => request<ApiCwlCurrent>(`${tagPath(tag)}/cwl/current`, signal),
};
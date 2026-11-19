import { HttpError } from "../asyncHandler";

/**
 * Thin client for the official Clash of Clans API (through the RoyaleAPI proxy, see COC_API_BASE).
 * Features: bearer token kept server-side, response cache, de-duplication of simultaneous identical
 * requests, and slightly-old data as a fallback if the API/proxy is down.
 *
 * Environment variables are read lazily (inside functions) so it doesn't matter whether dotenv has run yet.
 */

function config() {
  const tags = (process.env.ALLOWED_CLAN_TAGS ?? "")
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));
  return {
    base: (process.env.COC_API_BASE ?? "https://cocproxy.royaleapi.dev/v1").replace(/\/+$/, ""),
    token: process.env.COC_API_TOKEN ?? "",
    allowedClans: tags,
  };
}

export function clashStatus(): { configured: boolean; allowedClanCount: number } {
  const c = config();
  return { configured: c.token.length > 0, allowedClanCount: c.allowedClans.length };
}

/** Valid tag characters in Clash of Clans. */
const TAG_RE = /^#?[0289PYLQGRJCUV]{3,15}$/;

export function normalizeTag(input: string): string {
  const raw = input.trim().toUpperCase();
  if (!TAG_RE.test(raw)) throw new HttpError(400, "Invalid tag");
  return raw.startsWith("#") ? raw : `#${raw}`;
}

/** Same as normalizeTag, plus: only clans listed in ALLOWED_CLAN_TAGS (if the list is set) are accepted. */
export function normalizeClanTag(input: string): string {
  const tag = normalizeTag(input);
  const { allowedClans } = config();
  if (allowedClans.length > 0 && !allowedClans.includes(tag)) {
    throw new HttpError(403, "This clan is not enabled for this site");
  }
  return tag;
}

interface CacheEntry {
  data: unknown;
  freshUntil: number;
  storedAt: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();
const MAX_STALE_MS = 30 * 60_000;

async function fetchJson<T>(path: string, base: string, token: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new HttpError(502, "Could not reach the Clash of Clans API");
  }
  if (res.ok) return (await res.json()) as T;

  const body = (await res.json().catch(() => null)) as { reason?: string } | null;
  const reason = body?.reason ?? "";
  // eslint-disable-next-line no-console
  console.error(`[coc] ${res.status} ${reason} ${path}`); // path + status only, never the token

  if (res.status === 404) throw new HttpError(404, "Not found in Clash of Clans (wrong tag, or nothing is running right now)");
  // 403 "accessDenied" = the clan's war log is private; any other 403 = our key / IP setup is wrong
  if (res.status === 403) {
    if (reason === "accessDenied") throw new HttpError(403, "This clan's war log is private");
    throw new HttpError(502, "Clash of Clans API key or IP is not set up correctly");
  }
  if (res.status === 429) throw new HttpError(429, "Too many requests to Clash of Clans, try again shortly");
  if (res.status === 503) throw new HttpError(503, "Clash of Clans API is down or the game is in maintenance");
  throw new HttpError(502, "Clash of Clans API error");
}

/** GET a path of the Clash of Clans API (path starts with "/", tags must already be URL-encoded). */
export async function cocGet<T>(path: string, ttlMs = 30_000): Promise<T> {
  const { base, token } = config();
  if (!token) throw new HttpError(503, "Live data is not configured on the server");

  const now = Date.now();
  const hit = cache.get(path);
  if (hit && hit.freshUntil > now) return hit.data as T;

  const running = inflight.get(path);
  if (running) return running as Promise<T>;

  const request = (async (): Promise<T> => {
    try {
      const data = await fetchJson<T>(path, base, token);
      if (cache.size > 500) cache.clear();
      cache.set(path, { data, freshUntil: Date.now() + ttlMs, storedAt: Date.now() });
      return data;
    } catch (err) {
      // upstream trouble (not "not found" / "private"): serve the last good copy if it's recent enough
      if (err instanceof HttpError && err.status >= 500 && hit && now - hit.storedAt < MAX_STALE_MS) {
        return hit.data as T;
      }
      throw err;
    } finally {
      inflight.delete(path);
    }
  })();

  inflight.set(path, request);
  return request;
}

export const enc = encodeURIComponent;
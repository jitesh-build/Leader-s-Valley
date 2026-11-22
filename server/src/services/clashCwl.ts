import type { RawWar } from "../types/clash";
import { cocGet, enc } from "./clashApi";

const LIVE_TTL = 30_000;
const ENDED_TTL = 6 * 3_600_000;

/** A finished war never changes, so it is cached for hours; a running one is re-read every 30 seconds. */
export const getCwlWar = (warTag: string) =>
  cocGet<RawWar>(`/clanwarleagues/wars/${enc(warTag)}`, (w) => (w.state === "warEnded" ? ENDED_TTL : LIVE_TTL));

/** "clan|season|round" -> the war tag that is ours. Once known it never changes, so later requests make 1 call instead of 4. */
const ourWarTag = new Map<string, string>();

/** Our war in one CWL round (a round has up to 4 wars — we have to look for ours the first time). */
export async function findOurRoundWar(clanTag: string, season: string, round: number, warTags: string[]): Promise<RawWar | null> {
  const key = `${clanTag}|${season}|${round}`;
  const known = ourWarTag.get(key);
  if (known) return getCwlWar(known);

  const wars = await Promise.all(warTags.map(async (tag) => ({ tag, war: await getCwlWar(tag) })));
  const hit = wars.find(({ war }) => war.clan?.tag === clanTag || war.opponent?.tag === clanTag);
  if (hit) {
    if (ourWarTag.size > 2000) ourWarTag.clear();
    ourWarTag.set(key, hit.tag);
  }
  return hit?.war ?? null;
}
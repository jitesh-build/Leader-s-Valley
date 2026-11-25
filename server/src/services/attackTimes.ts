import { AttackSeen } from "../models/AttackSeen";
import { cocGet, enc, allowedClanTags } from "./clashApi";
import { mapLeagueGroup, mapWar, type MappedWar } from "./clashMappers";
import type { RawLeagueGroup, RawWar } from "../types/clash";

type Side = MappedWar["clan"];
type Member = Side["members"][number];
type Attack = Member["attacks"][number];

export type TimedAttack = Attack & {
  /** ISO time the server first saw this attack. null = unknown (seen before tracking existed). */
  observedAt: string | null;
};
export type TimedSide = Omit<Side, "members"> & { members: (Omit<Member, "attacks"> & { attacks: TimedAttack[] })[] };
export type TimedWar = Omit<MappedWar, "clan" | "opponent"> & { clan: TimedSide; opponent: TimedSide };

const warKeyOf = (ourTag: string, war: MappedWar): string => `${ourTag}|${war.preparationStartTime ?? war.startTime ?? ""}`;

/** Saves "first seen" for attacks not stored yet, and returns order -> first-seen time for all of them. */
async function recordAttacks(warKey: string, orders: number[]): Promise<Map<number, Date>> {
  const seen = new Map<number, Date>();
  if (orders.length === 0) return seen;

  const existing = await AttackSeen.find({ warKey, order: { $in: orders } }).lean();
  for (const d of existing) seen.set(d.order, d.firstSeenAt);

  const now = new Date();
  const missing = orders.filter((o) => !seen.has(o));
  if (missing.length > 0) {
    try {
      await AttackSeen.bulkWrite(
        missing.map((order) => ({
          updateOne: { filter: { warKey, order }, update: { $setOnInsert: { firstSeenAt: now } }, upsert: true },
        })),
        { ordered: false }
      );
    } catch (err) {
      // two requests recorded the same attack at once: harmless, the first one wins
      if ((err as { code?: number }).code !== 11000) throw err;
    }
    // read back, so a concurrent request's (earlier) time is the one we report
    const stored = await AttackSeen.find({ warKey, order: { $in: missing } }).lean();
    for (const d of stored) seen.set(d.order, d.firstSeenAt);
  }
  return seen;
}

/** Adds `observedAt` to every attack of a war. A "notInWar" answer is returned untouched. */
export async function withAttackTimes(war: MappedWar | { state: "notInWar" }, ourTag: string): Promise<TimedWar | { state: "notInWar" }> {
  if (!("clan" in war)) return war;

  const orders = [...new Set([...war.clan.members, ...war.opponent.members].flatMap((m) => m.attacks.map((a) => a.order)))];
  // Never stamp during preparation (there are no attacks) — and never fail the request because of the database.
  let seen = new Map<number, Date>();
  try {
    seen = await recordAttacks(warKeyOf(ourTag, war), orders);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[attack-times] could not read/write attack times:", err instanceof Error ? err.message : err);
  }

  const decorate = (side: Side): TimedSide => ({
    ...side,
    members: side.members.map((m) => ({
      ...m,
      attacks: m.attacks.map((a) => ({ ...a, observedAt: seen.get(a.order)?.toISOString() ?? null })),
    })),
  });
  return { ...war, clan: decorate(war.clan), opponent: decorate(war.opponent) };
}

// ---- background tracker: stamps attacks even when nobody has the War room page open ----

async function currentWarsOf(tag: string): Promise<RawWar[]> {
  const out: RawWar[] = [];
  try {
    const w = await cocGet<RawWar>(`/clans/${enc(tag)}/currentwar`, 30_000);
    if (w.state === "inWar") out.push(w);
  } catch {
    /* no regular war / private log: fine */
  }
  try {
    const group = await cocGet<RawLeagueGroup>(`/clans/${enc(tag)}/currentwar/leaguegroup`, 120_000);
    const started = mapLeagueGroup(group, tag).rounds.filter((r) => r.started);
    const latest = started[started.length - 1];
    if (latest) {
      const wars = await Promise.all(latest.warTags.map((t) => cocGet<RawWar>(`/clanwarleagues/wars/${enc(t)}`, 30_000)));
      const ours = wars.find((w) => w.clan?.tag === tag || w.opponent?.tag === tag);
      if (ours && ours.state === "inWar") out.push(ours);
    }
  } catch {
    /* not in CWL: fine */
  }
  return out;
}

let timer: NodeJS.Timeout | null = null;

/**
 * Every few minutes, look at the live war(s) of the clans in ALLOWED_CLAN_TAGS and remember when each attack
 * first showed up. Call once at startup, after the database is connected. Does nothing if ALLOWED_CLAN_TAGS is empty
 * (attacks are then only stamped when somebody opens the War room page).
 */
export function startAttackTracker(intervalMs = 4 * 60_000): void {
  if (timer) return;
  const tick = async () => {
    for (const tag of allowedClanTags()) {
      for (const raw of await currentWarsOf(tag)) {
        await withAttackTimes(mapWar(raw, tag), tag);
      }
    }
  };
  const run = () => {
    tick().catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[attack-times] tracker run failed:", err instanceof Error ? err.message : err);
    });
  };
  timer = setInterval(run, intervalMs);
  timer.unref();
  run();
}
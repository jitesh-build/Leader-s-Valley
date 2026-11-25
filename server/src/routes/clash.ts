import { Router } from "express";
import type { Request } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler, HttpError } from "../asyncHandler";
import { clashStatus, cocGet, enc, normalizeClanTag } from "../services/clashApi";
import { buildOverview } from "../services/clashOverview";
import { buildMembersReport } from "../services/clashMembersReport";
import { buildRoster } from "../services/clashRoster";
import { withAttackTimes } from "../services/attackTimes";
import {
  mapCapital,
  mapClanSummary,
  mapGoldPass,
  mapLeagueGroup,
  mapMember,
  mapRoles,
  mapWar,
  mapWarBrief,
  parseCocTime,
  stateFromTimes,
} from "../services/clashMappers";
import type { RawClan, RawGoldPass, RawLeagueGroup, RawRaidSeason, RawWar } from "../types/clash";

const router = Router();

// Protects the (shared) API key from being burned through by a flood of requests to this site.
router.use(rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false }));

// How long each kind of data is reused before asking the game again.
const TTL = {
  clan: 60_000,
  war: 30_000,
  cwlGroup: 120_000,
  cwlWar: 30_000,
  raid: 300_000,
  goldPass: 3_600_000,
};

const clanTagOf = (req: Request): string => normalizeClanTag(req.params.tag ?? "");

const getClan = (tag: string) => cocGet<RawClan>(`/clans/${enc(tag)}`, TTL.clan);
const getLeagueGroup = (tag: string) => cocGet<RawLeagueGroup>(`/clans/${enc(tag)}/currentwar/leaguegroup`, TTL.cwlGroup);
const getCwlWar = (warTag: string) => cocGet<RawWar>(`/clanwarleagues/wars/${enc(warTag)}`, TTL.cwlWar);
const getRaidSeasons = async (tag: string, limit: number) =>
  (await cocGet<{ items?: RawRaidSeason[] }>(`/clans/${enc(tag)}/capitalraidseasons?limit=${limit}`, TTL.raid)).items ?? [];

/** Loads every war of a CWL round (max 4) and returns [ours, all]. */
async function loadRound(tag: string, warTags: string[]) {
  const wars = await Promise.all(warTags.map(getCwlWar));
  const ours = wars.find((w) => w.clan?.tag === tag || w.opponent?.tag === tag) ?? null;
  return { wars, ours };
}

// GET /api/clash/status - is live data configured? (never returns secrets)
router.get("/status", (_req, res) => {
  res.json(clashStatus());
});

// GET /api/clash/clans/:tag - clan summary (+ the league in this site's format, e.g. "Crystal II")
router.get(
  "/clans/:tag",
  asyncHandler(async (req, res) => {
    res.json(mapClanSummary(await getClan(clanTagOf(req))));
  })
);

// GET /api/clash/clans/:tag/overview - everything the Home page + sidebar need, in ONE request.
// Only the clan itself is required; if another part fails (e.g. private war log) it is listed in `unavailable`.
router.get(
  "/clans/:tag/overview",
  asyncHandler(async (req, res) => {
    const tag = clanTagOf(req);
    const clan = await getClan(tag);

    const [raids, war, group, goldPass] = await Promise.allSettled([
      getRaidSeasons(tag, 1),
      cocGet<RawWar>(`/clans/${enc(tag)}/currentwar`, TTL.war),
      getLeagueGroup(tag),
      cocGet<RawGoldPass>("/goldpass/seasons/current", TTL.goldPass),
    ]);

    const unavailable: string[] = [];
    const notFound = (r: PromiseRejectedResult) => r.reason instanceof HttpError && r.reason.status === 404;

    if (raids.status === "rejected" && !notFound(raids)) unavailable.push("raid");
    if (war.status === "rejected" && !notFound(war)) unavailable.push("war");
    if (group.status === "rejected" && !notFound(group)) unavailable.push("cwl");
    if (goldPass.status === "rejected") unavailable.push("season");

    // our war in the newest CWL round
    let cwl: { group: RawLeagueGroup; ourWar: RawWar | null } | null = null;
    if (group.status === "fulfilled") {
      cwl = { group: group.value, ourWar: null };
      const rounds = mapLeagueGroup(group.value, tag).rounds.filter((r) => r.started);
      const latest = rounds[rounds.length - 1];
      const regularActive = war.status === "fulfilled" && war.value.state !== undefined && war.value.state !== "notInWar";
      if (latest && !regularActive) {
        try {
          cwl.ourWar = (await loadRound(tag, latest.warTags)).ours;
        } catch {
          unavailable.push("cwl");
        }
      }
    }

    res.json(
      buildOverview({
        clan,
        raid: raids.status === "fulfilled" ? (raids.value[0] ?? null) : null,
        war: war.status === "fulfilled" ? war.value : null,
        cwl,
        goldPass: goldPass.status === "fulfilled" ? goldPass.value : null,
        unavailable,
      })
    );
  })
);

// GET /api/clash/clans/:tag/roster - members with donations + attacks in the current war and latest raid weekend
router.get(
  "/clans/:tag/roster",
  asyncHandler(async (req, res) => {
    const tag = clanTagOf(req);
    const clan = await getClan(tag);
    const [raids, war] = await Promise.allSettled([getRaidSeasons(tag, 1), cocGet<RawWar>(`/clans/${enc(tag)}/currentwar`, TTL.war)]);

    const unavailable: string[] = [];
    const notFound = (r: PromiseRejectedResult) => r.reason instanceof HttpError && r.reason.status === 404;
    if (raids.status === "rejected" && !notFound(raids)) unavailable.push("raid");
    if (war.status === "rejected" && !notFound(war)) unavailable.push("war");

    res.json(
      buildRoster({
        clan,
        war: war.status === "fulfilled" ? war.value : null,
        raid: raids.status === "fulfilled" ? (raids.value[0] ?? null) : null,
        unavailable,
      })
    );
  })
);

// GET /api/clash/clans/:tag/members - member list with roles, town hall, trophies, donations
router.get(
  "/clans/:tag/members",
  asyncHandler(async (req, res) => {
    const clan = await getClan(clanTagOf(req));
    res.json({ clanTag: clan.tag, members: (clan.memberList ?? []).map(mapMember) });
  })
);

// GET /api/clash/clans/:tag/roles - members grouped by role (leader / co-leaders / elders)
router.get(
  "/clans/:tag/roles",
  asyncHandler(async (req, res) => {
    res.json(mapRoles(await getClan(clanTagOf(req))));
  })
);

// GET /api/clash/clans/:tag/capital?limit=6 - capital hall, districts, capital league, recent raid weekends (newest first)
router.get(
  "/clans/:tag/capital",
  asyncHandler(async (req, res) => {
    const tag = clanTagOf(req);
    const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 10);
    const [clan, seasons] = await Promise.all([getClan(tag), getRaidSeasons(tag, limit)]);
    res.json(mapCapital(clan, seasons));
  })
);

// GET /api/clash/clans/:tag/members-report - everything the Members page needs in ONE request:
// roster, current war, every started CWL round, recent raid weekends. Failed parts go in `unavailable`.
router.get(
  "/clans/:tag/members-report",
  asyncHandler(async (req, res) => {
    const tag = clanTagOf(req);
    const clan = await getClan(tag);
    const [raids, war, group] = await Promise.allSettled([
      getRaidSeasons(tag, 6),
      cocGet<RawWar>(`/clans/${enc(tag)}/currentwar`, TTL.war),
      getLeagueGroup(tag),
    ]);

    const unavailable = new Set<string>();
    const notFound = (r: PromiseRejectedResult) => r.reason instanceof HttpError && r.reason.status === 404;
    if (raids.status === "rejected" && !notFound(raids)) unavailable.add("raid");
    if (war.status === "rejected" && !notFound(war)) unavailable.add("war");
    if (group.status === "rejected" && !notFound(group)) unavailable.add("cwl");

    let cwl: { group: RawLeagueGroup; wars: { round: number; war: RawWar | null }[] } | null = null;
    if (group.status === "fulfilled") {
      const started = mapLeagueGroup(group.value, tag).rounds.filter((r) => r.started);
      const wars = await Promise.all(
        started.map(async (r) => {
          try {
            return { round: r.round, war: (await loadRound(tag, r.warTags)).ours };
          } catch {
            unavailable.add("cwl");
            return { round: r.round, war: null };
          }
        })
      );
      cwl = { group: group.value, wars };
    }

    res.json(
      buildMembersReport({
        clan,
        war: war.status === "fulfilled" ? war.value : null,
        cwl,
        raids: raids.status === "fulfilled" ? raids.value : [],
        unavailable: [...unavailable],
      })
    );
  })
);

// GET /api/clash/clans/:tag/war - the regular clan war happening now (state "notInWar" if none)
router.get(
  "/clans/:tag/war",
  asyncHandler(async (req, res) => {
    const tag = clanTagOf(req);
    const war = mapWar(await cocGet<RawWar>(`/clans/${enc(tag)}/currentwar`, TTL.war), tag);
    res.json(await withAttackTimes(war, tag)); // adds observedAt to each attack
  })
);

// GET /api/clash/clans/:tag/cwl - the CWL group: season, state, the 8 clans with their members' town halls, rounds
router.get(
  "/clans/:tag/cwl",
  asyncHandler(async (req, res) => {
    const tag = clanTagOf(req);
    res.json(mapLeagueGroup(await getLeagueGroup(tag), tag));
  })
);

// GET /api/clash/clans/:tag/cwl/current - our war in the newest CWL round (full detail, both rosters)
router.get(
  "/clans/:tag/cwl/current",
  asyncHandler(async (req, res) => {
    const tag = clanTagOf(req);
    const group = mapLeagueGroup(await getLeagueGroup(tag), tag);
    const started = group.rounds.filter((r) => r.started);
    const latest = started[started.length - 1];
    if (!latest) {
      res.json({ season: group.season, groupState: group.state, round: null, war: null });
      return;
    }
    const { ours } = await loadRound(tag, latest.warTags);
    res.json({
      season: group.season,
      groupState: group.state,
      round: latest.round,
      war: ours ? await withAttackTimes(mapWar(ours, tag), tag) : null,
    });
  })
);

// GET /api/clash/clans/:tag/cwl/rounds/:round - every war of one round (short), our war flagged + in full
router.get(
  "/clans/:tag/cwl/rounds/:round",
  asyncHandler(async (req, res) => {
    const tag = clanTagOf(req);
    const roundNo = Number(req.params.round);
    if (!Number.isInteger(roundNo) || roundNo < 1 || roundNo > 7) throw new HttpError(400, "round must be 1-7");

    const group = mapLeagueGroup(await getLeagueGroup(tag), tag);
    const round = group.rounds.find((r) => r.round === roundNo);
    if (!round || !round.started) throw new HttpError(404, "That round has not started yet");

    const { wars, ours } = await loadRound(tag, round.warTags);
    res.json({
      season: group.season,
      round: roundNo,
      wars: wars.map((w) => mapWarBrief(w, tag)),
      ourWar: ours ? mapWar(ours, tag) : null,
    });
  })
);

// GET /api/clash/clans/:tag/warlog?limit=10 - past regular wars (the clan's war log must be public)
router.get(
  "/clans/:tag/warlog",
  asyncHandler(async (req, res) => {
    const tag = clanTagOf(req);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 30);
    const data = await cocGet<{
      items?: {
        result?: string | null;
        endTime?: string;
        teamSize?: number;
        attacksPerMember?: number;
        clan?: { stars?: number; destructionPercentage?: number };
        opponent?: { name?: string; tag?: string; stars?: number; destructionPercentage?: number };
      }[];
    }>(`/clans/${enc(tag)}/warlog?limit=${limit}`, TTL.clan);

    res.json({
      clanTag: tag,
      items: (data.items ?? []).map((w) => ({
        result: w.result ?? null, // "win" | "lose" | "tie" | null (CWL rounds have no result here)
        endTime: parseCocTime(w.endTime),
        teamSize: w.teamSize ?? null,
        clan: { stars: w.clan?.stars ?? 0, destructionPercentage: w.clan?.destructionPercentage ?? 0 },
        opponent: {
          tag: w.opponent?.tag ?? null,
          name: w.opponent?.name ?? null,
          stars: w.opponent?.stars ?? 0,
          destructionPercentage: w.opponent?.destructionPercentage ?? 0,
        },
      })),
    });
  })
);

// GET /api/clash/clans/:tag/events - what is happening / coming, built from what the official API exposes.
// NOTE: the official API has no calendar of in-game events (Clan Games, season challenges, ...), so those are not included.
router.get(
  "/clans/:tag/events",
  asyncHandler(async (req, res) => {
    const tag = clanTagOf(req);

    const [goldPass, raids, war, group] = await Promise.allSettled([
      cocGet<RawGoldPass>("/goldpass/seasons/current", TTL.goldPass),
      getRaidSeasons(tag, 1),
      cocGet<RawWar>(`/clans/${enc(tag)}/currentwar`, TTL.war),
      getLeagueGroup(tag),
    ]);

    const events: {
      type: string;
      name: string;
      state: string | null;
      startTime: string | null;
      endTime: string | null;
      detail?: string;
    }[] = [];
    const unavailable: string[] = [];

    if (goldPass.status === "fulfilled") {
      const g = mapGoldPass(goldPass.value);
      events.push({ type: "gold-pass", name: "Gold Pass season", state: stateFromTimes(g.startTime, g.endTime), ...g });
    } else unavailable.push("goldPass");

    if (raids.status === "fulfilled") {
      const s = raids.value[0];
      if (s) {
        const startTime = parseCocTime(s.startTime);
        const endTime = parseCocTime(s.endTime);
        events.push({
          type: "raid-weekend",
          name: "Capital Raid Weekend",
          state: s.state === "ongoing" ? "active" : stateFromTimes(startTime, endTime),
          startTime,
          endTime,
        });
      }
    } else unavailable.push("raidWeekend");

    if (war.status === "fulfilled") {
      const w = mapWar(war.value, tag);
      if ("clan" in w) {
        events.push({
          type: "clan-war",
          name: "Clan War",
          state: w.state, // preparation | inWar | warEnded
          startTime: w.startTime,
          endTime: w.endTime,
          detail: `vs ${w.opponent.name ?? "unknown"}`,
        });
      }
    } else if (!(war.reason instanceof HttpError && war.reason.status === 404)) unavailable.push("clanWar");

    if (group.status === "fulfilled") {
      const g = mapLeagueGroup(group.value, tag);
      const started = g.rounds.filter((r) => r.started);
      const latest = started[started.length - 1];
      let startTime: string | null = null;
      let endTime: string | null = null;
      if (latest) {
        try {
          const { ours } = await loadRound(tag, latest.warTags);
          startTime = parseCocTime(ours?.startTime);
          endTime = parseCocTime(ours?.endTime);
        } catch {
          /* times are optional */
        }
      }
      events.push({
        type: "cwl",
        name: "Clan War League",
        state: g.state,
        startTime,
        endTime,
        detail: latest ? `Season ${g.season ?? "?"} · round ${latest.round}` : `Season ${g.season ?? "?"}`,
      });
    } else if (!(group.reason instanceof HttpError && group.reason.status === 404)) unavailable.push("cwl");

    res.json({ now: new Date().toISOString(), events, unavailable });
  })
);

export default router;
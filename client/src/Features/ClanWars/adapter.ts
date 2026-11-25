import type { ApiWar, ApiWarSide } from "../../lib/clashApi";
import type { StarValue, War, WarMember, WarSide, WarState } from "./types";

const STATES: readonly WarState[] = ["preparation", "inWar", "warEnded"];

const toStars = (n: number): StarValue => (n >= 3 ? 3 : n === 2 ? 2 : n === 1 ? 1 : 0);

function adaptSide(s: ApiWarSide): WarSide {
  return {
    tag: s.tag ?? "",
    name: s.name ?? "Unknown clan",
    clanLevel: s.level ?? 0,
    attacks: s.attacks,
    stars: s.stars,
    badge: s.badge,
    destructionPercentage: s.destructionPercentage,
    members: s.members.map(
      (m): WarMember => ({
        tag: m.tag,
        name: m.name,
        townhallLevel: m.townHallLevel ?? 1,
        mapPosition: m.mapPosition,
        attacks: m.attacks.map((a) => ({
          // the API nests attacks inside their attacker, so the attacker is always this member
          attackerTag: m.tag,
          defenderTag: a.defenderTag,
          stars: toStars(a.stars),
          destructionPercentage: a.destructionPercentage,
          order: a.order,
          // `observedAt` (when the attack happened) is not provided by the official API
        })),
      })
    ),
  };
}

/**
 * THE adapter: backend response -> the `War` shape the page, components and rule engine already use.
 * `defaultAttacks` = attacks per member when the API doesn't say (2 for regular wars, 1 for CWL).
 */
export function adaptWar(w: ApiWar, defaultAttacks: number): War | null {
  const state = STATES.find((s) => s === w.state);
  if (!state) return null;

  const start = w.startTime ?? w.preparationStartTime ?? new Date().toISOString();
  return {
    state,
    teamSize: w.teamSize ?? Math.max(w.clan.members.length, w.opponent.members.length),
    attacksPerMember: w.attacksPerMember ?? defaultAttacks,
    preparationStartTime: w.preparationStartTime ?? start,
    startTime: start,
    endTime: w.endTime ?? start,
    clan: adaptSide(w.clan),
    opponent: adaptSide(w.opponent),
  };
}
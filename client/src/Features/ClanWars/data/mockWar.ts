import type { StarValue, War, WarAttack, WarMember } from "../types";
import type { Assignments } from "../rules/types";

/** [defender map position, stars, destruction %, hours after war start] */
type RawAttack = [number, StarValue, number, number];
interface RawMember {
  name: string;
  th: number;
  attacks: RawAttack[];
}

const HOUR = 3_600_000;
const START = Date.now() - 15 * HOUR; // battle day, 15h in -> 9h left

const clanRaw: RawMember[] = [
  { name: "Warchief_Rex", th: 18, attacks: [[1, 2, 89, 1.0], [2, 3, 100, 6.5]] },
  { name: "ShadowFang", th: 17, attacks: [[2, 3, 100, 0.8], [3, 2, 91, 7.2]] },
  { name: "IronMaiden", th: 16, attacks: [[3, 2, 87, 1.5], [1, 1, 64, 10.0]] },
  { name: "DragonSlayer", th: 15, attacks: [[4, 3, 100, 2.0], [6, 3, 100, 9.0]] },
  { name: "Nightbloom", th: 14, attacks: [[2, 1, 58, 1.2]] },
  { name: "Valkyrie_K", th: 13, attacks: [[6, 2, 85, 2.2], [7, 3, 100, 8.0]] },
  { name: "StoneWall", th: 12, attacks: [[7, 3, 100, 3.1]] },
  { name: "BlazeRunner", th: 11, attacks: [[8, 1, 72, 3.4], [9, 2, 90, 11.0]] },
  { name: "Frostbite", th: 10, attacks: [[9, 2, 93, 4.0], [10, 2, 88, 12.0]] },
  { name: "Pixel_Pete", th: 9, attacks: [] },
  { name: "GoblinKing", th: 8, attacks: [[11, 2, 80, 5.0], [12, 3, 100, 13.0]] },
  { name: "RaidQueen", th: 7, attacks: [[12, 2, 76, 5.5], [11, 2, 85, 14.0]] },
  { name: "Tinker", th: 6, attacks: [[13, 3, 100, 6.0]] },
  { name: "BoomBoom", th: 5, attacks: [[14, 2, 82, 6.5], [15, 2, 79, 14.2]] },
  { name: "LittleBob", th: 4, attacks: [[15, 1, 55, 7.0], [14, 1, 60, 14.5]] },
  
];

const oppRaw: RawMember[] = [
  { name: "Odin_Prime", th: 16, attacks: [[1, 2, 90, 0.5], [2, 2, 88, 5.0]] },
  { name: "FrostGiant", th: 16, attacks: [[2, 3, 100, 1.0], [3, 2, 85, 8.0]] },
  { name: "Valhalla", th: 16, attacks: [[3, 2, 92, 1.5], [4, 2, 80, 9.5]] },
  { name: "SkaldSong", th: 15, attacks: [[4, 2, 89, 2.0], [5, 3, 100, 10.0]] },
  { name: "ThorsHammer", th: 15, attacks: [[5, 2, 81, 2.5], [6, 2, 86, 11.0]] },
  { name: "RuneCaster", th: 15, attacks: [[6, 3, 100, 3.0], [7, 2, 94, 12.0]] },
  { name: "IceWolf", th: 15, attacks: [[7, 2, 84, 3.5], [8, 2, 77, 12.5]] },
  { name: "Berserker", th: 14, attacks: [[8, 2, 90, 4.0], [9, 1, 60, 13.0]] },
  { name: "Longship", th: 14, attacks: [[9, 1, 68, 4.5]] },
  { name: "Draugr", th: 14, attacks: [[10, 2, 88, 5.0], [11, 1, 55, 13.5]] },
  { name: "Huginn", th: 14, attacks: [[11, 3, 100, 5.5]] },
  { name: "Muninn", th: 13, attacks: [[12, 2, 83, 6.0], [13, 1, 52, 14.0]] },
  { name: "Fenrir", th: 13, attacks: [] },
  { name: "Yggdrasil", th: 13, attacks: [[14, 2, 79, 6.5]] },
  { name: "Mjolnir", th: 12, attacks: [[15, 2, 85, 7.0]] },
];

function buildMembers(): { clan: WarMember[]; opp: WarMember[] } {
  type Flat = { side: "clan" | "opp"; pos: number; raw: RawAttack };
  const flat: Flat[] = [];
  clanRaw.forEach((m, i) => m.attacks.forEach((raw) => flat.push({ side: "clan", pos: i + 1, raw })));
  oppRaw.forEach((m, i) => m.attacks.forEach((raw) => flat.push({ side: "opp", pos: i + 1, raw })));
  flat.sort((a, b) => a.raw[3] - b.raw[3]);
  const orderOf = new Map<RawAttack, number>(flat.map((f, i) => [f.raw, i + 1]));

  const make = (raws: RawMember[], own: string, other: string): WarMember[] =>
    raws.map((m, i) => {
      const tag = `#${own}${i + 1}`;
      const attacks: WarAttack[] = m.attacks.map((raw) => ({
        attackerTag: tag,
        defenderTag: `#${other}${raw[0]}`,
        stars: raw[1],
        destructionPercentage: raw[2],
        order: orderOf.get(raw) ?? 0,
        observedAt: new Date(START + raw[3] * HOUR).toISOString(),
      }));
      return { tag, name: m.name, townhallLevel: m.th, mapPosition: i + 1, attacks };
    });

  return { clan: make(clanRaw, "A", "B"), opp: make(oppRaw, "B", "A") };
}

/** Same maths the game uses: only the best result on each base counts. */
function totals(attackers: WarMember[], defenderCount: number) {
  const best = new Map<string, { stars: number; dest: number }>();
  let attacks = 0;
  for (const a of attackers) {
    for (const atk of a.attacks) {
      attacks++;
      const cur = best.get(atk.defenderTag);
      if (!cur || atk.stars > cur.stars || (atk.stars === cur.stars && atk.destructionPercentage > cur.dest)) {
        best.set(atk.defenderTag, { stars: atk.stars, dest: atk.destructionPercentage });
      }
    }
  }
  let stars = 0;
  let destSum = 0;
  best.forEach((b) => {
    stars += b.stars;
    destSum += b.dest;
  });
  return { attacks, stars, destructionPercentage: Math.round((destSum / defenderCount) * 100) / 100 };
}

function buildWar(): War {
  const { clan, opp } = buildMembers();
  const size = clan.length;
  return {
    state: "inWar",
    teamSize: size,
    attacksPerMember: 2,
    preparationStartTime: new Date(START - 23 * HOUR).toISOString(),
    startTime: new Date(START).toISOString(),
    endTime: new Date(START + 24 * HOUR).toISOString(),
    clan: { tag: "#2L8Y9J", name: "Dark Exiles", badge: "", clanLevel: 18, members: clan, ...totals(clan, size) },
    opponent: { tag: "#9QR8V2", name: "Nordic Ravens", badge: "", clanLevel: 16, members: opp, ...totals(opp, size) },
  };
}

export const mockWar: War = buildWar();

/** Pretend assignments (in real use: from your CWL base assigner). */
export const mockAssignments: Assignments = {
  "#A1": [1, 2],
  "#A2": [2, 3],
  "#A3": [3, 4],
  "#A4": [4, 5],
};
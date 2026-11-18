/**
 * CWL leagues and the arena background of each one.
 * Every league is described by plain data (colours + a wall style + a path style),
 * and <ArenaBackground theme={...} /> turns that data into the SVG background.
 */

export type Pair = readonly [string, string];

/** A diamond-checker floor. colors = [base, diamond]. */
export interface TileStyle {
  colors: Pair;
  /** Grout line colour drawn around each diamond. */
  line?: string;
  /** Size of the repeating block, in tiles. Only needed when using `accents`. Default 1. */
  repeat?: number;
  /** Diamonds (col,row inside the repeating block) painted in another colour. */
  accents?: { col: number; row: number; color: string }[];
}

/**
 * Home Village wall artwork, one kind per wall level used by a league:
 *   wood     - level 1  : tall rope-tied logs among small pointed pickets   (Bronze)
 *   rock     - level 2  : uncut grey rocks on a dark base                   (Silver)
 *   gold     - level 5  : carved gold rail + golden pillars on a stone base (Gold)
 *   crystal  - level 6  : tall pointed elixir-pink crystals                 (Crystal)
 *   studded  - level 9  : dark stone blocks, pyramid caps, copper studs     (Master)
 *   banded   - level 10 : charcoal pillars, amber bar, silver studs         (Champion)
 *   marble   - level 12 : white chunky pillars on a gold rail               (Titan)
 *   rune     - level 16 : teal pyramid-capped boxes with purple "Y" glyphs  (Legend)
 */
export type WallKind = "wood" | "rock" | "gold" | "crystal" | "studded" | "banded" | "marble" | "rune";

/** Colours of a wall. Every kind reads the same fields (see WallArt in ArenaBackground for where each is used). */
export interface WallStyle {
  kind: WallKind;
  /** Main surface colour (wood/rock face, gold rail, crystal lit side, pillar body, strip). */
  light: string;
  /** Secondary surface (shaded side, band, box body). */
  base: string;
  /** Outlines and shadows. */
  dark: string;
  /** Trim: rope, amber bar, gold rail, purple band, copper studs, stone base strip. */
  accent?: string;
  /** Top of the pillars / caps. */
  cap?: string;
  /** Small ornaments: silver studs, purple glyphs and gems. */
  mark?: string;
}

/** The central path is a pattern of rectangles: bricks, cobbles, slabs, planks... */
export interface PathStyle {
  brick: {
    /** Brick width / height inside the 44 x 80 tile. 80 / h must be a whole, EVEN number when offset is true. */
    w: number;
    h: number;
    rx: number;
    gap: number;
    /** Every second row is shifted half a brick. */
    offset: boolean;
  };
  colors: readonly string[];
  mortar: string;
  /** 0..1 darkness of the shading on both edges of the path. */
  edgeShade: number;
}

export interface ArenaTheme {
  /** The big middle field. */
  field: TileStyle;
  /** The strip above the top wall (and the thin one at the bottom). */
  zone: TileStyle;
  wall: WallStyle;
  path: PathStyle;
  /** Subtle grain over the field (looks right on grass only). */
  texture: boolean;
}

export const LEAGUE_IDS = ["bronze", "silver", "gold", "crystal", "master", "champion", "titan", "legend"] as const;
export type LeagueId = (typeof LEAGUE_IDS)[number];

export const DIVISIONS = ["I", "II", "III"] as const;
export type Division = (typeof DIVISIONS)[number];

export interface League {
  id: LeagueId;
  name: string;
  theme: ArenaTheme;
}

const bronze: ArenaTheme = {
  field: { colors: ["#7fa638", "#8db443"] },
  zone: { colors: ["#6f9631", "#7aa338"] },
  wall: { kind: "wood", light: "#c98a4b", base: "#9a5a28", dark: "#5e3414", accent: "#d9c58a" },
  path: {
    brick: { w: 44, h: 20, rx: 6, gap: 2, offset: false },
    colors: ["#e0bd5e", "#d8b354"],
    mortar: "#c49b3f",
    edgeShade: 0.12,
  },
  texture: true,
};

const silver: ArenaTheme = {
  field: { colors: ["#5a9f3b", "#64aa44"] },
  zone: { colors: ["#4d8f32", "#559a3a"] },
  wall: { kind: "rock", light: "#c9c9cb", base: "#9a9a9d", dark: "#5d5d62", accent: "#7c7c81" },
  path: {
    brick: { w: 22, h: 20, rx: 7, gap: 3, offset: true },
    colors: ["#d4a672", "#c99a66", "#dcb07e"],
    mortar: "#9b6f46",
    edgeShade: 0.18,
  },
  texture: true,
};

const gold: ArenaTheme = {
  field: {
    colors: ["#e6b86d", "#dcab5f"],
    line: "#cf9f55",
    repeat: 4,
    accents: [
      { col: 0, row: 1, color: "#3a9d8c" },
      { col: 2, row: 3, color: "#3a9d8c" },
      { col: 3, row: 0, color: "#3a9d8c" },
    ],
  },
  zone: { colors: ["#3f9e8d", "#e5b366"] },
  wall: { kind: "gold", light: "#f2c63c", cap: "#ffe27a", base: "#b98618", dark: "#7a540c", accent: "#dedad2" },
  path: {
    brick: { w: 44, h: 20, rx: 2, gap: 2, offset: false },
    colors: ["#ece1bf", "#e4d8b3"],
    mortar: "#c8b98c",
    edgeShade: 0.1,
  },
  texture: false,
};

/** The original background of the project. */
const crystal: ArenaTheme = {
  field: { colors: ["#3f9e83", "#37917b"] },
  zone: { colors: ["#e3f0f6", "#d3e6ef"], line: "#bcd6e2" },
  wall: { kind: "crystal", light: "#ff7be0", base: "#e02fb8", dark: "#8a0f7e" },
  path: {
    brick: { w: 22, h: 20, rx: 1.5, gap: 1.5, offset: true },
    colors: ["#a39a9f", "#918890"],
    mortar: "#6f666c",
    edgeShade: 0.22,
  },
  texture: true,
};

const master: ArenaTheme = {
  field: { colors: ["#e2eef4", "#d4e5ee"], line: "#b8d0dc" },
  zone: { colors: ["#cfdfe8", "#c2d6e1"], line: "#a9c3d1" },
  wall: { kind: "studded", light: "#6c6c72", cap: "#8a8a92", base: "#3d3d44", dark: "#1f1f24", accent: "#c07a4e" },
  path: {
    brick: { w: 22, h: 20, rx: 8, gap: 3, offset: true },
    colors: ["#a9a9ae", "#9a9aa0", "#b3b3b8"],
    mortar: "#5d5d63",
    edgeShade: 0.2,
  },
  texture: false,
};

const champion: ArenaTheme = {
  field: { colors: ["#585251", "#4f4a49"], line: "#3b3736" },
  zone: { colors: ["#9a9a97", "#8d8d8a"], line: "#767673" },
  wall: { kind: "banded", light: "#34343a", cap: "#a29f9a", base: "#27272a", dark: "#121214", accent: "#f0a818", mark: "#d8d8d8" },
  path: {
    brick: { w: 44, h: 40, rx: 1, gap: 2, offset: false },
    colors: ["#3d3d42", "#38383d"],
    mortar: "#202024",
    edgeShade: 0.3,
  },
  texture: false,
};

const titan: ArenaTheme = {
  field: { colors: ["#a3ab97", "#98a08c"], line: "#828a76" },
  zone: { colors: ["#9aa28e", "#8f9783"], line: "#7a826e" },
  wall: { kind: "marble", light: "#f2f2f2", cap: "#ffffff", base: "#cfcfd0", dark: "#8a8a90", accent: "#dca01f" },
  path: {
    brick: { w: 11, h: 80, rx: 1, gap: 1.5, offset: false },
    colors: ["#e2ab3c", "#d99f2e"],
    mortar: "#b47b18",
    edgeShade: 0.15,
  },
  texture: false,
};

const legend: ArenaTheme = {
  field: { colors: ["#4a3f57", "#42384f"], line: "#33293f" },
  zone: { colors: ["#3d3349", "#362d42"], line: "#2b2236" },
  wall: { kind: "rune", light: "#6f8c92", cap: "#9ec3c7", base: "#4b4a55", dark: "#241a35", accent: "#7a46d6", mark: "#b78cff" },
  path: {
    brick: { w: 22, h: 10, rx: 1, gap: 1.5, offset: true },
    colors: ["#716384", "#675979"],
    mortar: "#463b57",
    edgeShade: 0.25,
  },
  texture: false,
};

/** Calm dark-green arena used where no league is chosen yet (e.g. behind the "new war" panel). */
export const DEFAULT_THEME: ArenaTheme = {
  field: { colors: ["#2f6f5f", "#2a6556"] },
  zone: { colors: ["#27574c", "#235046"] },
  wall: { kind: "rock", light: "#b9b9bc", base: "#8d8d92", dark: "#4f4f55", accent: "#6e6e74" },
  path: {
    brick: { w: 22, h: 20, rx: 1.5, gap: 1.5, offset: true },
    colors: ["#8a8288", "#7b737a"],
    mortar: "#5a535a",
    edgeShade: 0.22,
  },
  texture: true,
};

/** In ascending order — this is the order shown in the dropdown. */
export const LEAGUES: readonly League[] = [
  { id: "bronze", name: "Bronze", theme: bronze },
  { id: "silver", name: "Silver", theme: silver },
  { id: "gold", name: "Gold", theme: gold },
  { id: "crystal", name: "Crystal", theme: crystal },
  { id: "master", name: "Master", theme: master },
  { id: "champion", name: "Champion", theme: champion },
  { id: "titan", name: "Titan", theme: titan },
  { id: "legend", name: "Legend", theme: legend },
];

export const LEAGUE_BY_ID = Object.fromEntries(LEAGUES.map((l) => [l.id, l])) as Record<LeagueId, League>;

export function themeForLeague(id: LeagueId | null | undefined): ArenaTheme {
  return id ? LEAGUE_BY_ID[id].theme : DEFAULT_THEME;
}

/** "Crystal" + "II" -> "Crystal II" (this is what gets saved as war.leagueTier). */
export function formatTier(league: LeagueId, division: Division): string {
  return `${LEAGUE_BY_ID[league].name} ${division}`;
}

const DIVISION_LOOKUP: Record<string, Division> = { i: "I", ii: "II", iii: "III", "1": "I", "2": "II", "3": "III" };

/** Reads a saved tier string such as "Crystal II" / "crystal 2" back into its parts. */
export function parseLeagueTier(tier?: string | null): { league: LeagueId | null; division: Division | null } {
  const text = (tier ?? "").trim().toLowerCase();
  const league = LEAGUES.find((l) => text.includes(l.id))?.id ?? null;
  const raw = text.match(/\b(iii|ii|i|[123])\b/)?.[1];
  return { league, division: (raw !== undefined ? DIVISION_LOOKUP[raw] : undefined) ?? null };
}

/** Use this on the CWL page: <ArenaBackground theme={getLeagueTheme(war.leagueTier)} /> */
export function getLeagueTheme(tier?: string | null): ArenaTheme {
  return themeForLeague(parseLeagueTier(tier).league);
}
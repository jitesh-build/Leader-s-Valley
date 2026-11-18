import { useId } from "react";
import type { CSSProperties, ReactNode } from "react";
import { LEAGUE_BY_ID } from "../lib/leagues";
import type { ArenaTheme, TileStyle, WallStyle } from "../lib/leagues";

export interface ArenaBackgroundProps {
  /** Extra classes for the root element. */
  className?: string;
  /**
   * Total height of the arena. A number is px; a string is any CSS length ("300vh").
   * The arena is at least this tall and grows if the content inside is taller.
   */
  height?: number | string;
  /** Content drawn on top of the arena. */
  children?: ReactNode;
  /** Colours + wall style + path style. Get one from `lib/leagues` (defaults to Crystal, the original look). */
  theme?: ArenaTheme;
  /** Size (px) of one diamond-checker tile. */
  tileSize?: number;
  /** Width (px) of the stone path in the middle. */
  pathWidth?: number;
  /** Height (px) of the walls (default 44). */
  wallHeight?: number;
  /** Height (px) of the strip at the top. */
  topZoneHeight?: number;
  /** Height (px) of the strip at the bottom. */
  bottomZoneHeight?: number;
}

const clean = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");

/** Diamond (45° rotated) checkerboard pattern, with optional grout lines and accent diamonds. */
function TilePattern({ id, size, style }: { id: string; size: number; style: TileStyle }) {
  const rep = style.repeat ?? 1;
  const h = size / 2;
  const pts = `${h},0 ${size},${h} ${h},${size} 0,${h}`;
  const accents = new Map((style.accents ?? []).map((a) => [`${a.col},${a.row}`, a.color]));
  const line = style.line;

  const cells: ReactNode[] = [];
  for (let r = 0; r < rep; r++) {
    for (let c = 0; c < rep; c++) {
      cells.push(
        <g key={`${r}-${c}`} transform={`translate(${c * size} ${r * size})`}>
          <polygon
            points={pts}
            fill={accents.get(`${c},${r}`) ?? style.colors[1]}
            stroke={line ?? "none"}
            strokeWidth={line ? 1.5 : 0}
          />
          {line && (
            <polygon
              points={pts}
              fill="none"
              stroke={line}
              strokeWidth={1.5}
              transform={`translate(${h} ${h})`}
            />
          )}
        </g>
      );
    }
  }

  return (
    <pattern id={id} width={size * rep} height={size * rep} patternUnits="userSpaceOnUse">
      <rect width={size * rep} height={size * rep} fill={style.colors[0]} />
      {cells}
    </pattern>
  );
}

function FillRect({ id }: { id: string }) {
  return <rect width="100%" height="100%" fill={`url(#${id})`} />;
}

function Layer({
  style,
  children,
  className = "",
}: {
  style: CSSProperties;
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 ${className}`}
      style={style}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

/**
 * One repeating wall segment, drawn in a 56 x 36 box (the pattern scales it to wallHeight).
 * Pillars sit at x = 14 and 42, the gaps between them at x = 0, 28 and 56 (halves at 0/56 join the next tile).
 */
const PILLARS = [14, 42];
const GAPS = [0, 28, 56];
const diamond = (cx: number, cy: number, r: number) => `M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z`;

export function WallArt({ wall, grad }: { wall: WallStyle; grad: string }) {
  const fill = `url(#${grad})`;
  const cap = wall.cap ?? wall.light;
  const accent = wall.accent ?? wall.dark;
  const mark = wall.mark ?? cap;

  switch (wall.kind) {
    // Level 1: wooden posts tied with rope
    case "wood": {
      const pickets = [2, 9, 16, 34, 41, 48];
      const tops = [9, 6, 9, 9, 6, 9];
      return (
        <>
          {pickets.map((x, i) => {
            const t = tops[i] ?? 8;
            return (
              <g key={x}>
                <path d={`M${x} 34 V${t + 4} L${x + 3} ${t} L${x + 6} ${t + 4} V34 Z`} fill={fill} stroke={wall.dark} strokeWidth="0.7" strokeLinejoin="round" />
                <path d={`M${x + 1.6} 33 V${t + 6}`} stroke={wall.light} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
              </g>
            );
          })}
          <path d="M22 35 V11 L24 6 L28 1.5 L32 6 L34 11 V35 Z" fill={fill} stroke={wall.dark} strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M24.6 33 V11.5" stroke={wall.light} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M27.5 6 V33 M30.8 8 V33" stroke={wall.dark} strokeWidth="0.5" opacity="0.4" />
          {/* rope */}
          <rect y="22" width="56" height="4.5" fill={accent} stroke={wall.dark} strokeWidth="0.5" />
          <path d="M0 24.3 H56" stroke={wall.dark} strokeWidth="0.5" strokeDasharray="1.6 1.2" opacity="0.6" />
          <rect y="34" width="56" height="2" fill={wall.dark} opacity="0.4" />
        </>
      );
    }

    // Level 2: uncut rock
    case "rock": {
      const side = (
        <>
          <polygon points="11,28 11,21 16,18 22,20 23,28" fill={wall.base} stroke={wall.dark} strokeWidth="0.7" strokeLinejoin="round" />
          <polygon points="3,28 2,20 8,15 14,17 15,28" fill={wall.base} stroke={wall.dark} strokeWidth="0.7" strokeLinejoin="round" />
          <polygon points="2,20 8,15 14,17 9,20" fill={wall.light} opacity="0.85" />
          <polygon points="11,21 16,18 22,20 17,22" fill={wall.light} opacity="0.7" />
        </>
      );
      return (
        <>
          <rect y="25" width="56" height="9" fill={wall.dark} />
          <path d="M10 25 V34 M22 25 V34 M34 25 V34 M46 25 V34" stroke={accent} strokeWidth="0.9" />
          <path d="M0 29.5 H56" stroke={accent} strokeWidth="0.7" opacity="0.8" />
          {side}
          <g transform="translate(56 0) scale(-1 1)">{side}</g>
          <polygon points="18,28 17,16 23,7 32,5 39,12 38,28" fill={wall.base} stroke={wall.dark} strokeWidth="0.9" strokeLinejoin="round" />
          <polygon points="17,16 23,7 32,5 39,12 29,15" fill={wall.light} />
          <path d="M23 7 L29 15 L39 12" stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.35" strokeLinejoin="round" />
          <path d="M20 27 L20 19" stroke={wall.dark} strokeWidth="0.6" opacity="0.5" />
        </>
      );
    }

    // Level 5: carved gold
    case "gold":
      return (
        <>
          {/* stone base strip */}
          <rect y="26" width="56" height="10" fill={accent} />
          <rect y="26" width="56" height="1.4" fill="#fff" opacity="0.6" />
          <path d="M0 31 H56 M0 26 V31 M28 26 V31 M14 31 V36 M42 31 V36" stroke="#a9a69d" strokeWidth="0.8" />
          {/* gold rail */}
          <rect y="10" width="56" height="9" fill={wall.light} />
          <rect y="17" width="56" height="2.5" fill={wall.base} />
          <rect y="10" width="56" height="1.5" fill={cap} opacity="0.7" />
          <rect y="19.5" width="56" height="1.5" fill={wall.dark} opacity="0.35" />
          {/* pillars */}
          {PILLARS.map((c) => (
            <g key={c}>
              <rect x={c - 6} y="5" width="12" height="22" rx="3" fill={wall.base} stroke={wall.dark} strokeWidth="0.8" />
              <rect x={c - 6} y="3" width="12" height="11" rx="3.5" fill={wall.light} stroke={wall.dark} strokeWidth="0.8" />
              <rect x={c - 5} y="3.8" width="10" height="2.2" rx="1" fill={cap} opacity="0.8" />
              <rect x={c - 2} y="17" width="4" height="4" rx="1" fill={wall.dark} opacity="0.7" />
            </g>
          ))}
        </>
      );

    // Level 6: tall pointed elixir crystals
    case "crystal": {
      const shard = (cx: number, w: number, topY: number, shoulderY: number) => (
        <g key={`${cx}-${topY}`}>
          <path d={`M${cx - w / 2} 34 V${shoulderY} L${cx} ${topY} V34 Z`} fill={wall.light} stroke={wall.dark} strokeWidth="0.7" strokeLinejoin="round" />
          <path d={`M${cx} ${topY} L${cx + w / 2} ${shoulderY} V34 H${cx} Z`} fill={wall.base} stroke={wall.dark} strokeWidth="0.7" strokeLinejoin="round" />
          <path d={`M${cx - w / 2 + 1.6} 31 V${shoulderY + 1.5} L${cx - 0.8} ${topY + 4.5}`} stroke="#fff" strokeWidth="0.9" fill="none" opacity="0.6" strokeLinecap="round" />
          <path d={`M${cx + w / 2 - 1.4} 32 V${shoulderY + 3}`} stroke={wall.dark} strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
        </g>
      );
      return (
        <>
          {shard(8, 10, 14, 22)}
          {shard(48, 10, 12, 21)}
          {shard(18, 9, 9, 19)}
          {shard(38, 9, 10, 20)}
          {shard(28, 14, 1, 14)}
          <rect y="33" width="56" height="3" fill={wall.dark} opacity="0.5" />
        </>
      );
    }

    // Level 9: dark stone blocks with pyramid caps and copper studs
    case "studded":
      return (
        <>
          <rect y="21" width="56" height="12" fill={wall.base} stroke={wall.dark} strokeWidth="0.6" />
          {/* flat blocks between pillars */}
          {[0, 21, 28, 49].map((x) => (
            <rect key={x} x={x} y="10" width="7" height="12" fill={wall.light} stroke={wall.dark} strokeWidth="0.6" />
          ))}
          {PILLARS.map((c) => (
            <g key={c}>
              <rect x={c - 6} y="9" width="12" height="13" fill={wall.light} stroke={wall.dark} strokeWidth="0.7" />
              <path d={`M${c - 7} 10 L${c - 4} 2 L${c + 4} 2 L${c + 7} 10 Z`} fill={cap} stroke={wall.dark} strokeWidth="0.7" strokeLinejoin="round" />
              <path d={`M${c - 4} 2 L${c + 4} 2 L${c + 2.5} 6 L${c - 2.5} 6 Z`} fill="#fff" opacity="0.18" />
            </g>
          ))}
          {/* copper stud pairs */}
          {[0, 14, 28, 42, 56].map((x) => (
            <g key={x}>
              <path d={diamond(x, 24.5, 2)} fill={accent} stroke={wall.dark} strokeWidth="0.4" />
              <path d={diamond(x, 29, 2)} fill={accent} stroke={wall.dark} strokeWidth="0.4" />
            </g>
          ))}
          <rect y="32" width="56" height="4" fill={wall.dark} opacity="0.85" />
        </>
      );

    // Level 10: charcoal pillars, amber bar, silver studs
    case "banded":
      return (
        <>
          <rect y="9" width="56" height="22" fill={wall.base} stroke={wall.dark} strokeWidth="0.6" />
          {/* amber bar + small copper studs between the pillars */}
          {GAPS.map((m) => (
            <g key={m}>
              <rect x={m - 5} y="11" width="10" height="3" fill={accent} />
              <path d={diamond(m, 21, 1.4)} fill="#b8704a" />
            </g>
          ))}
          {PILLARS.map((c) => (
            <g key={c}>
              <rect x={c - 6} y="5" width="12" height="26" fill={wall.light} stroke={wall.dark} strokeWidth="0.7" />
              <rect x={c - 6.5} y="2" width="13" height="9" rx="1.5" fill={cap} stroke={wall.dark} strokeWidth="0.7" />
              <rect x={c - 5.5} y="2.8" width="11" height="1.8" rx="0.8" fill="#fff" opacity="0.35" />
              <path d={diamond(c, 18, 2)} fill={mark} stroke={wall.dark} strokeWidth="0.4" />
              <path d={diamond(c, 24, 2)} fill={mark} stroke={wall.dark} strokeWidth="0.4" />
            </g>
          ))}
          <rect y="31" width="56" height="5" fill="#6b6a66" stroke={wall.dark} strokeWidth="0.5" />
        </>
      );

    // Level 12: white chunky pillars on a gold rail
    case "marble":
      return (
        <>
          {/* white brick base */}
          <rect y="27" width="56" height="9" fill="#ececea" />
          <path d="M0 31.5 H56 M7 27 V31.5 M35 27 V31.5 M21 31.5 V36 M49 31.5 V36" stroke="#b9b9b5" strokeWidth="0.8" />
          {/* small blocks between the pillars */}
          {GAPS.map((m) =>
            [-6, -2, 2].map((dx) => (
              <rect key={`${m}${dx}`} x={m + dx} y="11" width="4" height="11" fill={wall.base} stroke={wall.dark} strokeWidth="0.4" />
            ))
          )}
          {/* gold rail with a bulge under each pillar */}
          <rect y="22" width="56" height="5" fill={accent} stroke={wall.dark} strokeWidth="0.4" />
          {PILLARS.map((c) => (
            <rect key={`b${c}`} x={c - 8} y="22" width="16" height="8" rx="3" fill={accent} stroke="#8f6410" strokeWidth="0.6" />
          ))}
          {PILLARS.map((c) => (
            <g key={c}>
              <rect x={c - 6} y="8" width="12" height="15" fill={wall.light} stroke={wall.dark} strokeWidth="0.6" />
              <rect x={c - 7} y="2" width="14" height="10" rx="3.5" fill={cap} stroke={wall.dark} strokeWidth="0.6" />
              <rect x={c - 5} y="3" width="10" height="2" rx="1" fill="#fff" opacity="0.7" />
            </g>
          ))}
        </>
      );

    // Level 16: teal pyramid-capped boxes, purple "Y" glyphs, gold trim
    case "rune":
      return (
        <>
          <rect y="14" width="56" height="15" fill={wall.light} stroke={wall.dark} strokeWidth="0.5" />
          <rect y="14" width="56" height="2.5" fill={accent} />
          {/* Y glyphs between the boxes */}
          {GAPS.map((m) => (
            <path
              key={m}
              d={`M${m - 4} 17.5 L${m} 22.5 L${m + 4} 17.5 M${m} 22.5 V27`}
              stroke={mark}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          <rect y="27" width="56" height="2" fill="#d9a21c" />
          {PILLARS.map((c) => (
            <g key={c}>
              <rect x={c - 7} y="12" width="14" height="19" fill={wall.base} stroke={wall.dark} strokeWidth="0.8" />
              <rect x={c - 7} y="12" width="14" height="3" fill={accent} />
              <path d={`M${c - 3.5} 18 L${c + 3.5} 18 L${c} 24 Z`} fill={mark} stroke={wall.dark} strokeWidth="0.4" strokeLinejoin="round" />
              <path d={`M${c - 8} 12 L${c} 2 L${c} 12 Z`} fill={cap} stroke={wall.dark} strokeWidth="0.6" strokeLinejoin="round" />
              <path d={`M${c} 2 L${c + 8} 12 L${c} 12 Z`} fill={wall.light} stroke={wall.dark} strokeWidth="0.6" strokeLinejoin="round" />
            </g>
          ))}
          <rect y="31" width="56" height="5" fill={wall.dark} />
        </>
      );
  }
}

export default function ArenaBackground({
  className = "",
  height = 2400,
  children,
  theme = LEAGUE_BY_ID.crystal.theme,
  tileSize = 90,
  pathWidth = 44,
  wallHeight = 44,
  topZoneHeight = 90,
  bottomZoneHeight = 10,
}: ArenaBackgroundProps) {
  const uid = clean(useId());
  const fieldId = `field-${uid}`;
  const zoneId = `zone-${uid}`;
  const wallId = `wall-${uid}`;
  const wallGradId = `wallgrad-${uid}`;
  const brickId = `brick-${uid}`;
  const noiseId = `noise-${uid}`;

  const { field, zone, wall, path } = theme;

  // Wall pattern is drawn in a 56x36 box and scaled to wallHeight.
  const wallScale = wallHeight / 36;

  // Path pattern is drawn in a 44x80 box and scaled to pathWidth.
  const brickScale = pathWidth / 44;
  const b = path.brick;
  const rows = Math.max(1, Math.round(80 / b.h));
  const bricks: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const offset = b.offset && r % 2 ? b.w / 2 : 0;
    for (let x = offset - b.w, i = 0; x < 44; x += b.w, i++) {
      bricks.push(
        <rect
          key={`${r}-${i}`}
          x={x + b.gap / 2}
          y={r * b.h + b.gap / 2}
          width={b.w - b.gap}
          height={b.h - b.gap}
          rx={b.rx}
          fill={path.colors[(r + i) % path.colors.length]}
        />
      );
    }
  }

  return (
    // In normal flow, so the page scrolls through the whole arena:
    // top strip + wall, long field in the middle, wall + strip at the bottom.
    // `overflow-clip` (not `overflow-hidden`) so the arena still clips its decorations but does NOT
    // become a scroll container — that keeps `position: sticky` working for the floating panels inside.
    <div
      className={`relative w-full overflow-clip ${className}`}
      style={{ backgroundColor: field.colors[0], minHeight: height }}
    >
      {/* Field: diamond checker */}
      <Layer style={{ top: 0, bottom: 0 }}>
        <defs>
          <TilePattern id={fieldId} size={tileSize} style={field} />
          <TilePattern id={zoneId} size={tileSize} style={zone} />
          <filter id={noiseId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <FillRect id={fieldId} />
        {theme.texture && (
          <rect
            width="100%"
            height="100%"
            filter={`url(#${noiseId})`}
            opacity={0.1}
            style={{ mixBlendMode: "multiply" }}
          />
        )}
      </Layer>

      {/* Top + bottom strips */}
      <Layer style={{ top: 0, height: topZoneHeight }}>
        <FillRect id={zoneId} />
      </Layer>
      <Layer style={{ bottom: 0, height: bottomZoneHeight }}>
        <FillRect id={zoneId} />
      </Layer>

      {/* Walls */}
      {[{ top: topZoneHeight - wallHeight / 2 }, { bottom: bottomZoneHeight - wallHeight / 2 }].map((pos, i) => (
        <Layer
          key={i}
          style={{
            ...pos,
            height: wallHeight,
            filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.35))",
          }}
        >
          <defs>
            <linearGradient id={`${wallGradId}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={wall.light} />
              <stop offset="0.45" stopColor={wall.base} />
              <stop offset="1" stopColor={wall.dark} />
            </linearGradient>
            <pattern
              id={`${wallId}-${i}`}
              width={56 * wallScale}
              height={wallHeight}
              viewBox="0 0 56 36"
              patternUnits="userSpaceOnUse"
            >
              <WallArt wall={wall} grad={`${wallGradId}-${i}`} />
            </pattern>
          </defs>
          <FillRect id={`${wallId}-${i}`} />
        </Layer>
      ))}

      {/* Central path */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2"
        style={{
          width: pathWidth,
          boxShadow: "0 0 14px rgba(0,0,0,0.28)",
        }}
      >
        <svg className="absolute inset-0" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id={brickId}
              width={pathWidth}
              height={80 * brickScale}
              viewBox="0 0 44 80"
              patternUnits="userSpaceOnUse"
            >
              <rect width="44" height="80" fill={path.mortar} />
              {bricks}
            </pattern>
          </defs>
          <FillRect id={brickId} />
        </svg>
        {/* Edge shading */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, rgba(0,0,0,${path.edgeShade}), transparent 22%, transparent 78%, rgba(0,0,0,${path.edgeShade}))`,
          }}
        />
      </div>

      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
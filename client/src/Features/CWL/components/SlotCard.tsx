import React, { type CSSProperties } from "react";
import { Plus, Star, X } from "lucide-react";
import type { Slot, StarCount } from "../types";
import { STAR_COUNTS, STAR_TIER_CLASSES } from "../lib/starTiers";
import { OUTLINE, SOFT } from "../lib/outline";

export interface SlotCardProps {
  slot: Slot;
  isActive: boolean;
  /** this slot is "armed" to receive the next enemy pip click into its multi-select pool */
  isArmed: boolean;
  error?: string;
  onSelect: () => void;
  onSetStars: (stars: StarCount) => void;
  onClear: () => void;
  onToggleMultiSelect: () => void;
  onArmAddEnemyBase: () => void;
  onRemoveEnemyBase: (baseNumber: number) => void;
}

/** Small crosshair glyph used for the multi-target toggle — no icon library dependency required. */
function CrosshairIcon({ active }: { active: boolean }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="7" />
      <line x1="12" y1="1" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="1" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="23" y2="12" />
    </svg>
  );
}

/**
 * A dotted line made of round dots (horizontal or vertical).
 * This is what replaces the old "vs" between the team base and the enemy base(s).
 */
function Dots({
  orientation,
  active,
  className = "",
}: {
  orientation: "h" | "v";
  active: boolean;
  className?: string;
}): React.ReactElement {
  const color = active ? "rgba(236,193,90,1)" : "rgba(255,255,255,0.9)";
  const style: CSSProperties =
    orientation === "h"
      ? { height: 4, backgroundSize: "8px 4px", backgroundRepeat: "repeat-x" }
      : { width: 4, backgroundSize: "4px 8px", backgroundRepeat: "repeat-y" };
  return (
    <span
      aria-hidden
      className={`block ${className}`}
      style={{
        ...style,
        backgroundImage: `radial-gradient(circle, ${color} 1.6px, transparent 1.9px)`,
        backgroundPosition: "center",
        filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.75))",
      }}
    />
  );
}

const BOX = "flex h-10 w-[88px] shrink-0 items-center";
const TONE = {
  team: "border-gold/70 bg-black/45 text-gold",
  enemy: "border-red-400/70 bg-red-950/50 text-red-300",
};

function BaseBox({
  tone,
  empty,
  children,
}: {
  tone: "team" | "enemy";
  empty: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className={`${BOX} justify-center rounded-lg border-2 ${TONE[tone]} ${
        empty ? "border-dashed text-sm font-semibold opacity-70" : "text-base font-extrabold"
      }`}
      style={empty ? SOFT : OUTLINE}
    >
      {children}
    </div>
  );
}

export default function SlotCard({
  slot,
  isActive,
  isArmed,
  error,
  onSelect,
  onSetStars,
  onClear,
  onToggleMultiSelect,
  onArmAddEnemyBase,
  onRemoveEnemyBase,
}: SlotCardProps): React.ReactElement {
  const isFilled = slot.isMultiSelect
    ? slot.teamBaseNumber !== null && slot.enemyBaseNumbers.length > 0
    : slot.teamBaseNumber !== null && slot.enemyBaseNumber !== null;

  // One entry per enemy row. Normal slot: a single box. Multi-target slot: every
  // enemy base stacked one below the other, plus the "+ new" button as the last row.
  const rows: { key: string; node: React.ReactNode }[] = slot.isMultiSelect
    ? [
        ...slot.enemyBaseNumbers.map((n) => ({
          key: `b${n}`,
          node: (
            <div
              className={`${BOX} justify-between rounded-lg border-2 pl-3 pr-1.5 text-base font-extrabold ${TONE.enemy}`}
              style={OUTLINE}
            >
              #{n}
              <button
                type="button"
                title={`Remove base #${n} from this slot's pool`}
                aria-label={`Remove base #${n}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveEnemyBase(n);
                }}
                className="rounded p-0.5 text-red-200/70 transition hover:bg-white/15 hover:text-white"
              >
                <X size={14} strokeWidth={3} />
              </button>
            </div>
          ),
        })),
        {
          key: "add",
          node: (
            <button
              type="button"
              title="Add another enemy base to this slot"
              onClick={(e) => {
                e.stopPropagation();
                onArmAddEnemyBase();
              }}
              className={`${BOX} justify-center gap-1 rounded-lg border-2 border-dashed text-xs font-bold transition ${
                isArmed
                  ? "animate-pulse border-gold bg-gold/15 text-gold"
                  : "border-white/35 text-white/70 hover:border-white/70 hover:text-white"
              }`}
            >
              <Plus size={14} strokeWidth={3} />
              {isArmed ? "pick base" : "new"}
            </button>
          ),
        },
      ]
    : [
        {
          key: "single",
          node: (
            <BaseBox tone="enemy" empty={slot.enemyBaseNumber === null}>
              {slot.enemyBaseNumber !== null ? `#${slot.enemyBaseNumber}` : "select"}
            </BaseBox>
          ),
        },
      ];

  const cardState = isActive
    ? "border-gold shadow-[0_0_0_2px_rgba(236,193,90,0.35),0_12px_26px_rgba(0,0,0,0.5)]"
    : isFilled
      ? "border-green-500/60 hover:border-green-400"
      : "border-line hover:border-gold/60";

  return (
    <div
      onClick={onSelect}
      className={`flex cursor-pointer flex-col rounded-xl border-2 bg-black/55 p-3.5 shadow-xl backdrop-blur-sm transition ${cardState}`}
    >
      {/* header */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-extrabold text-white" style={OUTLINE}>
          Slot {slot.index}
          {slot.isMultiSelect && (
            <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-gold">
              MULTI
            </span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-pressed={slot.isMultiSelect}
            title={
              slot.isMultiSelect
                ? "Multi-target on — click to switch back to a single target"
                : "Click to allow multiple enemy targets"
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggleMultiSelect();
            }}
            className={`flex h-7 w-7 items-center justify-center rounded-md border transition ${
              slot.isMultiSelect
                ? "border-gold/70 bg-gold/20 text-gold"
                : "border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <CrosshairIcon active={slot.isMultiSelect} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="rounded-md px-2 py-1 text-[10px] font-bold tracking-wider text-white/60 transition hover:bg-red-500/20 hover:text-red-300"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* team base  ·····  enemy base(s) */}
      <div className="flex flex-1 items-center py-3">
        <BaseBox tone="team" empty={slot.teamBaseNumber === null}>
          {slot.teamBaseNumber !== null ? `#${slot.teamBaseNumber}` : "select"}
        </BaseBox>

        {/* stem from the team base */}
        <Dots orientation="h" active={isActive} className="w-5 shrink-0" />

        {/* enemy column: one row for a normal slot, a fork of rows for a multi-target slot */}
        <div className="relative flex min-w-0 flex-1 flex-col gap-2">
          {rows.length > 1 && <Dots orientation="v" active={isActive} className="absolute bottom-5 left-0 top-5 -translate-x-1/2" />}
          {rows.map((row) => (
            <div key={row.key} className="flex h-10 items-center">
              <Dots orientation="h" active={isActive} className="min-w-3 flex-1" />
              {row.node}
            </div>
          ))}
        </div>
      </div>

      {isArmed && (
        <p className="mb-2 text-center text-[11px] font-semibold text-gold" style={SOFT}>
          Tap an enemy base in the panel above to add it
        </p>
      )}

      {/* stars needed */}
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold tracking-[0.14em] text-white/60" style={SOFT}>
          STARS NEEDED
        </span>
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {STAR_COUNTS.map((n) => {
            const selected = slot.starsNeeded === n;
            const tier = STAR_TIER_CLASSES[n];
            return (
              <button
                key={n}
                type="button"
                aria-pressed={selected}
                onClick={() => onSetStars(n)}
                className={`flex h-7 w-10 items-center justify-center gap-0.5 rounded-md border-2 text-xs font-extrabold transition ${
                  selected ? `${tier.bg} ${tier.border} ${tier.text}` : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
                }`}
              >
                {n}
                <Star size={11} className="fill-current" />
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-[11px] font-semibold text-red-300" style={SOFT}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ChevronRight, Star } from "lucide-react";
import { thImage } from "../assets";
import type { Violation } from "../rules/types";
import type { War, WarAttack, WarMember } from "../types";
import { OUTLINE, SOFT } from "./outline";
import StarRow from "./StarRow";

interface Props {
  war: War;
  violations: Violation[];
  /** Called when the "Broken rules" line of a player's details is clicked. */
  onShowRuleBreaks: (memberTag: string) => void;
}

type Side = "clan" | "enemy";
interface Selection {
  side: Side;
  tag: string;
}

type Severity = "major" | "minor";
 
/** Name colour on the map: white = clean, amber = broke a minor rule, red = broke a major rule. */
const NAME_COLOR: Record<Severity | "none", string> = {
  none: "text-white",
  minor: "text-amber-400",
  major: "text-red-400",
};
 
/** The worst severity among rules a member has actually BROKEN ("at risk" doesn't count yet). */
function worstSeverity(list: Violation[]): Severity | null {
  let worst: Severity | null = null;
  for (const v of list) {
    if (v.status !== "violated") continue;
    if (v.severity === "major") return "major";
    worst = "minor";
  }
  return worst;
}

const MAX_ROW = 132; // row height up to 15v15 — also the biggest a row ever gets
const MIN_ROW = 72; // never shrink below this (50v50)
const MAX_TH = 88; // biggest town hall picture

/** 132px up to 15v15, then rows shrink gradually so 50v50 doesn't turn into an endless scroll. */
function rowHeightFor(size: number): number {
  if (size <= 15) return MAX_ROW;
  return Math.max(MIN_ROW, Math.round(MAX_ROW - (size - 15) * 1.71));
}

/** Name text and town hall size that fit inside a row of the given height. */
function metricsFor(rowH: number): { text: string; th: number } {
  const label = rowH >= 110 ? { text: "text-base", line: 24 } : rowH >= 90 ? { text: "text-sm", line: 20 } : { text: "text-xs", line: 16 };
  return { text: label.text, th: Math.min(MAX_TH, rowH - label.line - 8) };
}

const GLOW: Record<Side, string> = {
  clan: "drop-shadow-[0_0_12px_rgba(236,193,90,0.95)]",
  enemy: "drop-shadow-[0_0_12px_rgba(248,113,113,0.95)]",
};

/** Town Hall picture; falls back to a "TH16" tile if the image file isn't there yet. */
function TownHall({ level, size, glow }: { level: number; size: number; glow: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        className={`flex items-center justify-center rounded-xl bg-black/40 font-display font-bold text-gold ${glow}`}
        style={{ ...OUTLINE, width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.28)) }}
      >
        TH{level}
      </span>
    );
  }
  return (
    <img
      src={thImage(level)}
      alt={`Town Hall ${level}`}
      draggable={false}
      onError={() => setFailed(true)}
      className={`object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] ${glow}`}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * One base on the map. Odd positions: town hall on the left half, details float right next to it.
 * Even positions: town hall on the right half, details float left next to it.
 */
function BaseRow({
  position,
  name,
  level,
  side,
  rowH,
  severity,
  selected,
  onToggle,
  children,
}: {
  position: number;
  name: string;
  level: number;
  side: Side;
  rowH: number;
  severity: Severity | null;
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const odd = position % 2 === 1;
  const m = metricsFor(rowH);

  const base = (
    <div className="flex min-w-0 flex-col items-center justify-center gap-1 px-2">
      <span className={`block max-w-full truncate font-extrabold ${NAME_COLOR[severity ?? "none"]} ${m.text}`} style={OUTLINE}>
        {position}. {name}
      </span>

      {/* The details card is anchored to this wrapper, so it always sits right beside its town hall */}
      <div className="relative">
        <button
          type="button"
          aria-expanded={selected}
          aria-label={`${name}: ${selected ? "hide" : "show"} details`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="block rounded-lg transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
        >
          <TownHall level={level} size={m.th} glow={selected ? GLOW[side] : ""} />
        </button>

        {selected && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute top-1/2 z-20 w-max min-w-[180px] max-w-[240px] -translate-y-1/2 rounded-xl border-2 bg-black/60 px-4 py-3 shadow-2xl backdrop-blur-sm ${
              odd ? "left-full ml-3" : "right-full mr-3"
            } ${side === "clan" ? "border-line" : "border-red-900/70"}`}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 items-center" style={{ height: rowH }}>
      {odd ? (
        <>
          {base}
          <div />
        </>
      ) : (
        <>
          <div />
          {base}
        </>
      )}
    </div>
  );
}

function StatLine({ icon, label, value, valueClass = "text-white" }: { icon: ReactNode; label: ReactNode; value: ReactNode; valueClass?: string }) {
  return (
    <span className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-xs text-white/80" style={SOFT}>
        {icon}
        {label}
      </span>
      <span className={`text-base font-extrabold ${valueClass}`} style={OUTLINE}>
        {value}
      </span>
    </span>
  );
}

function TeamDetails({
  used,
  slots,
  stars,
  broken,
  atRisk,
  severity,
  onShowRules,
}: {
  used: number;
  slots: number;
  stars: number;
  broken: number;
  atRisk: number;
  severity: Severity | null;
  onShowRules: () => void;
}) {
  const hasRules = broken + atRisk > 0;
  const tone = broken === 0 ? "text-green-400" : severity === "major" ? "text-red-400" : "text-amber-400";

  const rules = (
    <>
      <StatLine
        icon={<AlertTriangle size={15} className={tone} />}
        label={
          <span className="flex items-center gap-0.5">
            Broken rules
            {hasRules && <ChevronRight size={12} className="text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white" />}
          </span>
        }
        value={broken}
        valueClass={tone}
      />
      {atRisk > 0 && (
        <span className="block text-right text-[11px] font-semibold text-amber-400" style={SOFT}>
          +{atRisk} at risk
        </span>
      )}
    </>
  );

  return (
    <div className="space-y-2">
      <StatLine icon={<img src="/cw_sword.png" alt="" className="h-5 w-5 object-contain" />} label="Attacks" value={`${used}/${slots}`} />
      <StatLine icon={<Star size={15} className="fill-gold text-gold" />} label="Stars taken" value={stars} />
      {hasRules ? (
        // Same size as the plain row: the negative margin cancels the padding that gives the hover highlight room.
        <button
          type="button"
          onClick={onShowRules}
          title="Show this player's rule breaks"
          className="group -mx-2 block w-[calc(100%+1rem)] rounded-md px-2 text-left transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
        >
          {rules}
        </button>
      ) : (
        <div>{rules}</div>
      )}
    </div>
  );
}

function EnemyDetails({ best, attackerName }: { best?: WarAttack; attackerName: string | null }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-[0.14em] text-white/60" style={SOFT}>
        BEST ATTACK
      </div>
      {best ? (
        <>
          <div className="mt-1 max-w-[200px] truncate text-base font-extrabold text-white" style={OUTLINE}>
            {attackerName ?? "Unknown"}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-4">
            <StarRow count={best.stars} size={16} />
            <span className="text-base font-extrabold text-white" style={OUTLINE}>
              {Math.round(best.destructionPercentage)}%
            </span>
          </div>
        </>
      ) : (
        <div className="mt-1 text-sm text-white/70" style={SOFT}>
          Not attacked yet
        </div>
      )}
    </div>
  );
}

export default function WarMap({ war, violations, onShowRuleBreaks }: Props) {
  const [selected, setSelected] = useState<Selection | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clanMembers = useMemo(() => [...war.clan.members].sort((a, b) => a.mapPosition - b.mapPosition), [war]);
  const enemyMembers = useMemo(() => [...war.opponent.members].sort((a, b) => a.mapPosition - b.mapPosition), [war]);
  const clanByTag = useMemo(() => new Map<string, WarMember>(war.clan.members.map((m) => [m.tag, m])), [war]);

  const rowH = rowHeightFor(Math.max(war.teamSize, clanMembers.length, enemyMembers.length));

  const violationsByTag = useMemo(() => {
    const map = new Map<string, Violation[]>();
    for (const v of violations) {
      const list = map.get(v.memberTag);
      if (list) list.push(v);
      else map.set(v.memberTag, [v]);
    }
    return map;
  }, [violations]);

  // The single best result our side has landed on each enemy base (most stars, then highest %).
  const bestAgainst = useMemo(() => {
    const map = new Map<string, WarAttack>();
    for (const m of war.clan.members) {
      for (const a of m.attacks) {
        const cur = map.get(a.defenderTag);
        if (!cur || a.stars > cur.stars || (a.stars === cur.stars && a.destructionPercentage > cur.destructionPercentage)) {
          map.set(a.defenderTag, a);
        }
      }
    }
    return map;
  }, [war]);

  const toggle = (side: Side, tag: string) => setSelected((prev) => (prev && prev.side === side && prev.tag === tag ? null : { side, tag }));
  const isSelected = (side: Side, tag: string) => selected?.side === side && selected.tag === tag;

  return (
    <section aria-label="War map" onClick={() => setSelected(null)}>
      <p className="mb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-white/80" style={SOFT}>
        <span>Tap a town hall for details</span>
        <span className="text-amber-400">● minor rule broken</span>
        <span className="text-red-400">● major rule broken</span>
      </p>

      <div className="grid grid-cols-2">
        <div>
          {clanMembers.map((m) => {
            const list = violationsByTag.get(m.tag) ?? [];
            const broken = list.filter((v) => v.status === "violated").length;
            const severity = worstSeverity(list);
            return (
              <BaseRow
                key={m.tag}
                position={m.mapPosition}
                name={m.name}
                level={m.townhallLevel}
                side="clan"
                rowH={rowH}
                severity={severity}
                selected={isSelected("clan", m.tag)}
                onToggle={() => toggle("clan", m.tag)}
              >
                <TeamDetails
                  used={m.attacks.length}
                  slots={war.attacksPerMember}
                  stars={m.attacks.reduce((s, a) => s + a.stars, 0)}
                  broken={broken}
                  atRisk={list.length - broken}
                  severity={severity}
                  onShowRules={() => onShowRuleBreaks(m.tag)}
                />
              </BaseRow>
            );
          })}
        </div>

        <div>
          {enemyMembers.map((m) => {
            const best = bestAgainst.get(m.tag);
            return (
              <BaseRow
                key={m.tag}
                position={m.mapPosition}
                name={m.name}
                level={m.townhallLevel}
                side="enemy"
                rowH={rowH}
                severity={null}
                selected={isSelected("enemy", m.tag)}
                onToggle={() => toggle("enemy", m.tag)}
              >
                <EnemyDetails best={best} attackerName={best ? (clanByTag.get(best.attackerTag)?.name ?? null) : null} />
              </BaseRow>
            );
          })}
        </div>
      </div>
    </section>
  );
}
import { useEffect, useMemo, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import type { Violation } from "../rules/types";
import FloatingPanel from "./FloatingPanel";
import { OUTLINE, SOFT } from "./outline";

interface Props {
  violations: Violation[];
  activeRuleCount: number;
  onClose: () => void;
  /** Player to scroll to and highlight. Change `nonce` to play it again for the same player. */
  focus?: { tag: string; nonce: number } | null;
}

/**
 * How serious a player's record is:
 *  major – they broke at least one major rule
 *  minor – they only broke minor rules
 *  risk  – nothing broken yet, but they will break a rule if nothing changes
 */
type Level = "major" | "minor" | "risk";

const LEVEL_ORDER: Record<Level, number> = { major: 0, minor: 1, risk: 2 };

const LEVEL_STYLE: Record<Level, { name: string; badge: string; chip: string; label: string; glow: string }> = {
  major: { name: "text-red-400", badge: "bg-red-500/20 text-red-300", chip: "bg-red-500/25 text-red-300", label: "MAJOR", glow: "248,113,113" },
  minor: { name: "text-amber-400", badge: "bg-amber-500/20 text-amber-300", chip: "bg-amber-500/25 text-amber-300", label: "MINOR", glow: "251,191,36" },
  risk: { name: "text-white", badge: "bg-white/10 text-white/80", chip: "bg-white/15 text-white/70", label: "AT RISK", glow: "236,193,90" },
};

function levelOf(list: Violation[]): Level {
  const broken = list.filter((v) => v.status === "violated");
  if (broken.some((v) => v.severity === "major")) return "major";
  return broken.length > 0 ? "minor" : "risk";
}

const FLASH_MS = 3000;
const EASE = "ease-in-out";

/** Fades a glow in and back out over 3 seconds on the player's card and on each of their rules. */
function flash(block: HTMLElement, rgb: string): Animation[] {
  const animations: Animation[] = [
    block.animate(
      [
        { boxShadow: `0 0 0 0 rgba(${rgb},0)`, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.4)", easing: EASE },
        { boxShadow: `0 0 22px 3px rgba(${rgb},0.8)`, borderColor: `rgba(${rgb},0.95)`, backgroundColor: `rgba(${rgb},0.18)`, easing: EASE },
        { boxShadow: `0 0 0 0 rgba(${rgb},0)`, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.4)" },
      ],
      { duration: FLASH_MS }
    ),
  ];
  block.querySelectorAll<HTMLElement>("[data-rule-row]").forEach((row) => {
    animations.push(
      row.animate(
        [
          { backgroundColor: `rgba(${rgb},0)`, easing: EASE },
          { backgroundColor: `rgba(${rgb},0.28)`, easing: EASE },
          { backgroundColor: `rgba(${rgb},0)` },
        ],
        { duration: FLASH_MS }
      )
    );
  });
  return animations;
}

export default function ViolationsPanel({ violations, activeRuleCount, onClose, focus }: Props) {
  const blockRefs = useRef(new Map<string, HTMLLIElement>());

  const groups = useMemo(() => {
    const map = new Map<string, Violation[]>();
    for (const v of violations) {
      const list = map.get(v.memberTag);
      if (list) list.push(v);
      else map.set(v.memberTag, [v]);
    }
    return [...map.values()]
      .map((list) => ({ list, level: levelOf(list) }))
      .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || b.list.length - a.list.length);
  }, [violations]);

  // Read inside the effect through a ref so a recalculation of the violations doesn't replay the highlight.
  const levelByTag = useRef(new Map<string, Level>());
  levelByTag.current = new Map(groups.flatMap((g) => (g.list[0] ? [[g.list[0].memberTag, g.level] as const] : [])));

  useEffect(() => {
    if (!focus) return;
    const block = blockRefs.current.get(focus.tag);
    if (!block) return;

    // Scroll only the panel's own list (scrollIntoView could also scroll the whole page).
    const body = block.closest<HTMLElement>("[data-panel-body]");
    if (body) {
      const b = block.getBoundingClientRect();
      const c = body.getBoundingClientRect();
      const top = body.scrollTop + (b.top - c.top) - (body.clientHeight - b.height) / 2;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      body.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
    }

    const animations = flash(block, LEVEL_STYLE[levelByTag.current.get(focus.tag) ?? "risk"].glow);
    return () => animations.forEach((a) => a.cancel());
  }, [focus]);

  const count = (level: Level): number => groups.filter((g) => g.level === level).length;

  return (
    <FloatingPanel eyebrow="AUTO-CHECK" title="Rule breakers" onClose={onClose}>
      <div className="flex flex-wrap gap-2 text-[11px] font-bold">
        <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-red-300 ring-1 ring-red-500/40">{count("major")} major</span>
        <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-amber-300 ring-1 ring-amber-500/40">{count("minor")} minor</span>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/70 ring-1 ring-white/20">{count("risk")} at risk</span>
      </div>

      {groups.length === 0 ? (
        <div className="mt-4 flex items-center gap-4 rounded-lg border border-white/10 bg-black/40 p-4">
          <ShieldCheck size={26} className="shrink-0 text-gold" strokeWidth={1.6} />
          <div>
            <div className="font-display text-lg font-bold text-white" style={OUTLINE}>
              All clear
            </div>
            <div className="text-xs text-white/70" style={SOFT}>
              {activeRuleCount === 0 ? "No auto-checked rules are switched on yet." : "Everyone is following the active rules."}
            </div>
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {groups.map(({ list, level }) => {
            const first = list[0];
            if (!first) return null;
            const style = LEVEL_STYLE[level];
            return (
              <li
                key={first.memberTag}
                ref={(el) => {
                  if (el) blockRefs.current.set(first.memberTag, el);
                  else blockRefs.current.delete(first.memberTag);
                }}
                className="rounded-lg border border-white/10 bg-black/40 p-3.5"
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded font-display text-sm font-bold ${style.badge}`}>
                    {first.memberPosition}
                  </span>
                  <span className={`min-w-0 truncate text-sm font-extrabold ${style.name}`} style={OUTLINE}>
                    {first.memberName}
                  </span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${style.chip}`}>{style.label}</span>
                </div>

                <ul className="mt-2.5 space-y-0.5">
                  {list.map((v) => (
                    <li key={v.id} data-rule-row className="-mx-2 rounded-md px-2 py-1.5 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${
                            v.severity === "major" ? "bg-red-500/25 text-red-300" : "bg-amber-500/25 text-amber-300"
                          }`}
                        >
                          {v.severity === "major" ? "MAJOR" : "MINOR"}
                        </span>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white/70">
                          {v.status === "violated" ? "BROKEN" : "AT RISK"}
                        </span>
                        <span className="text-white/85" style={SOFT}>
                          {v.ruleTitle}
                        </span>
                      </div>
                      <div className="mt-1 text-white/60" style={SOFT}>
                        {v.message}
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </FloatingPanel>
  );
}
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { LEAGUES } from "../lib/leagues";
import type { LeagueId } from "../lib/leagues";
import { OUTLINE } from "../lib/outline";

interface LeagueSelectProps {
  value: LeagueId | null;
  onChange: (league: LeagueId) => void;
  /** Shows the red "needs a value" border. */
  invalid?: boolean;
}

/** Height of one row (py-1.5 + 24px swatch) and the menu's own padding + border. */
const ROW_H = 36;
const MENU_PAD = 12;
const GAP = 6;
const EDGE = 12;
const FULL_H = LEAGUES.length * ROW_H + MENU_PAD;

interface MenuPos {
  left: number;
  width: number;
  /** Set when the menu opens downward. */
  top?: number;
  /** Set when the menu opens upward. */
  bottom?: number;
  maxHeight: number;
}

/** Small square showing the league's floor colour and wall colour. */
function Swatch({ league }: { league: (typeof LEAGUES)[number] }): React.ReactElement {
  const { field, wall } = league.theme;
  return (
    <span
      aria-hidden
      className="h-6 w-6 shrink-0 rounded-md border border-black/60"
      style={{
        background: `linear-gradient(135deg, ${field.colors[0]} 50%, ${wall.light} 50%)`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
      }}
    />
  );
}

/**
 * Custom dropdown (the native <select> can't be styled to fit the game look).
 * The menu is rendered in a portal with fixed positioning, so no parent panel can clip it, and it opens
 * upward / shrinks (and scrolls) when there isn't enough room below the button.
 */
export default function LeagueSelect({ value, onChange, invalid = false }: LeagueSelectProps): React.ReactElement {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [pos, setPos] = useState<MenuPos | null>(null);

  const selectedIndex = LEAGUES.findIndex((l) => l.id === value);
  const selected = selectedIndex >= 0 ? LEAGUES[selectedIndex] : undefined;

  const measure = useCallback((): void => {
    const btn = buttonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const vh = window.innerHeight;
    const spaceBelow = vh - r.bottom - GAP - EDGE;
    const spaceAbove = r.top - GAP - EDGE;
    // open downward if the whole list fits (or at least a decent part of it), otherwise use the bigger side
    const down = spaceBelow >= Math.min(FULL_H, 240) || spaceBelow >= spaceAbove;
    const room = down ? spaceBelow : spaceAbove;
    const maxHeight = Math.max(120, Math.min(FULL_H, room));
    setPos(
      down
        ? { left: r.left, width: r.width, top: r.bottom + GAP, maxHeight }
        : { left: r.left, width: r.width, bottom: vh - r.top + GAP, maxHeight }
    );
  }, []);

  // close when clicking anywhere outside (the menu lives in a portal, so check both elements)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // keep the menu attached to the button while the page scrolls / resizes
  useEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  // keep the highlighted row visible
  useEffect(() => {
    if (!open || !pos) return;
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${hi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, hi, pos]);

  function openMenu(): void {
    setHi(selectedIndex >= 0 ? selectedIndex : 0);
    measure();
    setOpen(true);
  }

  function choose(i: number): void {
    const league = LEAGUES[i];
    if (!league) return;
    onChange(league.id);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent): void {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHi((h) => (h + 1) % LEAGUES.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHi((h) => (h - 1 + LEAGUES.length) % LEAGUES.length);
        break;
      case "Home":
        e.preventDefault();
        setHi(0);
        break;
      case "End":
        e.preventDefault();
        setHi(LEAGUES.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(hi);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`flex h-[42px] w-full items-center gap-2.5 rounded-lg border bg-black/40 px-2.5 text-left text-sm transition focus:outline-none ${
          invalid
            ? "border-red-400/80 focus:border-red-300"
            : open
              ? "border-gold/60"
              : "border-line hover:border-gold/40 focus:border-gold/50"
        }`}
      >
        {selected ? (
          <>
            <Swatch league={selected} />
            <span className="flex-1 truncate font-bold text-white" style={OUTLINE}>
              {selected.name}
            </span>
          </>
        ) : (
          <span className="flex-1 truncate pl-1 text-white/40">Select a league</span>
        )}
        <ChevronDown size={18} strokeWidth={3} className={`shrink-0 text-white/70 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && pos
        ? createPortal(
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label="League"
              className="fixed z-[100] overflow-y-auto rounded-xl border-2 border-line bg-black/90 p-1 shadow-[0_16px_36px_rgba(0,0,0,0.6)] backdrop-blur-md"
              style={{
                left: pos.left,
                width: pos.width,
                top: pos.top,
                bottom: pos.bottom,
                maxHeight: pos.maxHeight,
              }}
            >
              {LEAGUES.map((league, i) => {
                const isSelected = league.id === value;
                return (
                  <li
                    key={league.id}
                    data-idx={i}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHi(i)}
                    onClick={() => choose(i)}
                    className={`flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm font-bold transition-colors ${
                      hi === i ? "bg-gold/15" : ""
                    } ${isSelected ? "text-gold" : "text-white"}`}
                  >
                    <Swatch league={league} />
                    <span className="flex-1">{league.name}</span>
                    {isSelected && <Check size={16} strokeWidth={3} />}
                  </li>
                );
              })}
            </ul>,
            document.body
          )
        : null}
    </div>
  );
}
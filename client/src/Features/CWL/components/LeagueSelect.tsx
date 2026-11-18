import React, { useEffect, useId, useRef, useState } from "react";
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

/** Custom dropdown (the native <select> can't be styled to fit the game look). Supports keyboard + click-outside. */
export default function LeagueSelect({ value, onChange, invalid = false }: LeagueSelectProps): React.ReactElement {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);

  const selectedIndex = LEAGUES.findIndex((l) => l.id === value);
  const selected = selectedIndex >= 0 ? LEAGUES[selectedIndex] : null;

  // close when clicking anywhere outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // keep the highlighted row visible
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${hi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, hi]);

  function openMenu(): void {
    setHi(selectedIndex >= 0 ? selectedIndex : 0);
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

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="League"
          className="absolute left-0 right-0 z-30 mt-1.5 max-h-64 overflow-y-auto rounded-xl border-2 border-line bg-black/90 p-1 shadow-[0_16px_36px_rgba(0,0,0,0.6)] backdrop-blur-md"
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
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-bold transition-colors ${
                  hi === i ? "bg-gold/15" : ""
                } ${isSelected ? "text-gold" : "text-white"}`}
              >
                <Swatch league={league} />
                <span className="flex-1">{league.name}</span>
                {isSelected && <Check size={16} strokeWidth={3} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
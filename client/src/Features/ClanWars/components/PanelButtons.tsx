import { ChevronLeft, ScrollText, ShieldAlert } from "lucide-react";
import { OUTLINE } from "./outline";

/** Beige "Return Home"-style button → toggles the rule breakers overlay. */
export function RuleBreakersButton({
  open,
  onClick,
  count,
  tone,
}: {
  open: boolean;
  onClick: () => void;
  /** Number shown in the red/amber badge (0 hides it). */
  count: number;
  tone: "red" | "amber";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={open}
      aria-label={open ? "Hide rule breakers" : "Show rule breakers"}
      title="Rule breakers"
      className={`pointer-events-auto relative flex h-[76px] w-[76px] items-center justify-center rounded-xl border-[3px] bg-gradient-to-b from-[#d6cba9] to-[#a99c78] transition ${
        open
          ? "translate-y-[3px] border-[#f3ecd6] shadow-[0_1px_0_#4a4333,0_3px_8px_rgba(0,0,0,0.5)]"
          : "border-[#ece3c9] shadow-[0_4px_0_#4a4333,0_8px_14px_rgba(0,0,0,0.45)] hover:brightness-105"
      }`}
    >
      <ShieldAlert size={38} strokeWidth={2} className="text-[#8c1d1d] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]" />
      {count > 0 && (
        <span
          className={`absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-black/70 px-1 text-xs font-extrabold text-white ${
            tone === "red" ? "bg-red-600" : "bg-amber-500"
          }`}
          style={OUTLINE}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/** Dark "Home"-sidebar-style button → toggles the clan rules overlay. */
export function RulesButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={open}
      aria-label={open ? "Hide clan rules" : "Show clan rules"}
      title="Clan rules"
      className={`pointer-events-auto flex h-[88px] w-[68px] flex-col items-center justify-center gap-1 rounded-xl border-[3px] bg-gradient-to-b from-[#56565a] to-[#2b2b2e] transition ${
        open
          ? "translate-y-[3px] border-[#8a8a8f] shadow-[0_1px_0_#0c0c0d,0_3px_8px_rgba(0,0,0,0.5)]"
          : "border-[#77777c] shadow-[0_4px_0_#0c0c0d,0_8px_14px_rgba(0,0,0,0.45)] hover:brightness-110"
      }`}
    >
      <ScrollText size={28} strokeWidth={2} className="text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]" />
      <ChevronLeft size={26} strokeWidth={3.5} className={`text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.6)] transition ${open ? "rotate-180" : ""}`} />
    </button>
  );
}
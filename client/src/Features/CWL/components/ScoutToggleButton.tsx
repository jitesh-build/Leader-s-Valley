import { ChevronLeft, Eye } from "lucide-react";

/** Dark chunky button pinned to the right edge → shows / hides the enemy scouting sidebar. */
export default function ScoutToggleButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={open}
      aria-label={open ? "Hide enemy scouting" : "Show enemy scouting"}
      title="Enemy scouting"
      className={`pointer-events-auto flex h-[88px] w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-[3px] bg-gradient-to-b from-[#56565a] to-[#2b2b2e] transition ${
        open
          ? "translate-y-[3px] border-[#8a8a8f] shadow-[0_1px_0_#0c0c0d,0_3px_8px_rgba(0,0,0,0.5)]"
          : "border-[#77777c] shadow-[0_4px_0_#0c0c0d,0_8px_14px_rgba(0,0,0,0.45)] hover:brightness-110"
      }`}
    >
      <Eye size={28} strokeWidth={2} className="text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]" />
      {/* arrow points left (= "open") while closed, flips to point right (= "tuck away") while open */}
      <ChevronLeft size={26} strokeWidth={3.5} className={`text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.6)] transition ${open ? "rotate-180" : ""}`} />
    </button>
  );
}
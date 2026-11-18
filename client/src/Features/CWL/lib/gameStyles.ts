/**
 * Shared class strings so every CWL control looks like the in-game UI
 * (same chunky beige / dark buttons and dark translucent panels as the Clan Wars page).
 */

/** Dark, translucent, outlined panel — the same look as the Clan Wars scoreboard. */
export const PANEL = "rounded-xl border-2 border-line bg-black/55 shadow-2xl backdrop-blur-sm";

/** Beige "Return Home"-style chunky button. */
export const BTN_BEIGE =
  "rounded-xl border-[3px] border-[#ece3c9] bg-gradient-to-b from-[#d6cba9] to-[#a99c78] font-extrabold text-[#3a2f12] " +
  "shadow-[0_4px_0_#4a4333,0_8px_14px_rgba(0,0,0,0.45)] transition hover:brightness-105 " +
  "active:translate-y-[3px] active:shadow-[0_1px_0_#4a4333,0_3px_8px_rgba(0,0,0,0.5)] " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:active:translate-y-0";

/** Dark "Home"-sidebar-style chunky button. */
export const BTN_DARK =
  "rounded-xl border-[3px] border-[#77777c] bg-gradient-to-b from-[#56565a] to-[#2b2b2e] font-bold text-white " +
  "shadow-[0_4px_0_#0c0c0d,0_8px_14px_rgba(0,0,0,0.45)] transition hover:brightness-110 " +
  "active:translate-y-[3px] active:shadow-[0_1px_0_#0c0c0d,0_3px_8px_rgba(0,0,0,0.5)]";

/** Red chunky button for destructive actions. */
export const BTN_RED =
  "rounded-xl border-[3px] border-[#d98a8a] bg-gradient-to-b from-[#a63a3a] to-[#5c1b1b] font-bold text-white " +
  "shadow-[0_4px_0_#2a0b0b,0_8px_14px_rgba(0,0,0,0.45)] transition hover:brightness-110 " +
  "active:translate-y-[3px] active:shadow-[0_1px_0_#2a0b0b,0_3px_8px_rgba(0,0,0,0.5)]";

/** Gold call-to-action (same as the "Add rule" / "Save changes" buttons). */
export const BTN_GOLD =
  "rounded-lg bg-gradient-to-b from-gold-soft to-gold font-bold text-[#1a1405] shadow-lg shadow-gold/10 transition hover:brightness-110 disabled:opacity-50";

export const INPUT =
  "w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 [color-scheme:dark] focus:border-gold/50 focus:outline-none";

export const LABEL = "mb-1.5 block text-[10px] font-bold tracking-[0.14em] text-white/60";
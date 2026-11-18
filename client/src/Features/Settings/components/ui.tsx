import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-white placeholder:text-muted focus:border-gold/50 focus:outline-none";

export const primaryButton =
  "h-[40px] rounded-lg bg-gradient-to-b from-gold-soft to-gold px-5 text-sm font-bold text-[#1a1405] shadow-lg shadow-gold/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100";

export const ghostButton =
  "h-[40px] rounded-lg border border-line px-4 text-sm font-medium text-muted2 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

export function SectionCard({ id, eyebrow, title, description, children }: { id: string; eyebrow: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-xl border border-line bg-card p-6">
      <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">{eyebrow}</div>
      <h2 className="mt-2 font-display text-[26px] font-bold text-white">{title}</h2>
      {description && <p className="mt-1 max-w-2xl text-xs text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-muted">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[11px] text-red-400">{error}</span> : hint ? <span className="mt-1 block text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

export function Chip({ tone, children }: { tone: "green" | "amber" | "red" | "muted"; children: ReactNode }) {
  const styles = {
    green: "bg-green-500/15 text-green-400 ring-green-500/30",
    amber: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
    red: "bg-red-500/15 text-red-400 ring-red-500/30",
    muted: "bg-white/5 text-muted2 ring-white/10",
  } as const;
  return <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ring-1 ${styles[tone]}`}>{children}</span>;
}
import { useEffect, useRef, type ReactNode } from "react";
import { AlertTriangle, ArrowRight, Check, ListPlus, X } from "lucide-react";
import { demotionTarget, evaluatePromotion, evaluateReview, MIN_KNOWN_CHECKS } from "../criteria";
import type { Role, RoleCriteria, RoleMember } from "../types";
import { CheckIcon, CheckStrip, Pill, RoleChip, TownHall } from "./ui";

interface Props {
  member: RoleMember;
  criteria: RoleCriteria;
  /** There is already an open item on the to-do list for this player. */
  planned: boolean;
  onClose: () => void;
  onPlan: (member: RoleMember, to: Role, reason: string) => void;
}

function Tile({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg bg-panel px-3 py-2.5">
      <div className="text-[9px] font-semibold tracking-[0.14em] text-muted">{label.toUpperCase()}</div>
      <div className="mt-1 font-display text-xl font-bold leading-none text-white">{value}</div>
      {sub && <div className="mt-1 text-[10px] text-muted">{sub}</div>}
    </div>
  );
}

const btn = "flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition";

/** Slide-over with everything about one player: numbers, every promotion check, and review flags. */
export default function MemberDrawer({ member: m, criteria, planned, onClose, onPlan }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // focus the close button, close on Esc, and hand focus back to whatever opened the drawer
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  const ratio = m.donationsReceived > 0 ? m.donations / m.donationsReceived : m.donations;
  const promotion = evaluatePromotion(m, criteria);
  const review = evaluateReview(m, criteria);
  const demoteTo = demotionTarget(m.role);
  const known = promotion ? promotion.results.length - promotion.unknown.length : 0;
  const almost = promotion !== null && !promotion.ready && promotion.failing.length <= 1 && known >= MIN_KNOWN_CHECKS;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${m.name} details`}
        className="h-full w-[min(460px,100vw)] overflow-y-auto border-l border-line bg-card p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <TownHall level={m.townHallLevel} size={64} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-[30px] font-bold leading-tight text-white">{m.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <RoleChip role={m.role} />
              <span className="font-mono text-[11px] text-muted">{m.tag}</span>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-md p-1.5 text-muted2 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {planned && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2 text-xs font-semibold text-gold">
            <Check size={14} /> This player is on your to-do list.
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Tile label="Donated" value={m.donations.toLocaleString("en-US")} sub="this season" />
          <Tile label="Received" value={m.donationsReceived.toLocaleString("en-US")} sub="this season" />
          <Tile label="Ratio" value={ratio.toFixed(2)} sub="donated ÷ received" />
          <Tile label="War attacks" value={m.war ? `${m.war.attacksUsed}/${m.war.attacksAvailable}` : "—"} sub={m.war ? "current war" : "not in the war"} />
          <Tile label="Raid attacks" value={m.raid ? `${m.raid.attacksUsed}/${m.raid.attackLimit}` : "—"} sub={m.raid ? "latest weekend" : "not listed"} />
          <Tile label="Rules broken" value={m.ruleBreaks ?? "—"} sub={m.ruleBreaks === null ? "no war to check" : "current war"} />
        </div>

        {/* ---- promotion ---- */}
        <section className="mt-7" aria-label="Promotion">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-xl font-bold text-white">Promotion</h3>
            {promotion && <Pill tone={promotion.ready ? "green" : almost ? "amber" : "muted"}>{promotion.ready ? "READY" : almost ? "ALMOST" : "NOT YET"}</Pill>}
          </div>

          {promotion === null ? (
            <p className="mt-2 text-xs text-muted">The leader is already at the top, so there's nothing to promote.</p>
          ) : (
            <>
              <div className="mt-2 flex items-center gap-1.5">
                <RoleChip role={m.role} />
                <ArrowRight size={12} className="text-muted" />
                <RoleChip role={promotion.to} />
              </div>
              <div className="mt-3">
                <CheckStrip statuses={promotion.results.map((r) => r.status)} />
              </div>
              <ul className="mt-3 space-y-1.5">
                {promotion.results.map((r) => (
                  <li key={r.id} className="flex items-start gap-2.5 rounded-lg bg-panel px-3 py-2">
                    <span className="mt-0.5 shrink-0"><CheckIcon status={r.status} /></span>
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold ${r.status === "unknown" ? "text-muted" : "text-white"}`}>{r.label}</div>
                      <div className="text-[11px] text-muted">{r.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={planned}
                onClick={() =>
                  onPlan(
                    m,
                    promotion.to,
                    promotion.ready
                      ? "Meets every promotion check that has data"
                      : promotion.failing.length > 0
                        ? `Leader's call — still missing: ${promotion.failing.map((f) => f.label.toLowerCase()).join(", ")}`
                        : "Leader's call"
                  )
                }
                className={`${btn} mt-4 ${planned ? "cursor-default border-line text-muted" : "border-gold/40 text-gold hover:bg-gold/10"}`}
              >
                <ListPlus size={15} /> Add promotion to to-do
              </button>
            </>
          )}
        </section>

        {/* ---- review (Elders and Co-leaders only) ---- */}
        {demoteTo !== null && (
          <section className="mt-7" aria-label="Review">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-xl font-bold text-white">Review</h3>
              <Pill tone={review ? "amber" : "green"}>{review ? "FLAGGED" : "ALL GOOD"}</Pill>
            </div>
            {review ? (
              <>
                <ul className="mt-3 space-y-1.5">
                  {review.reasons.map((r) => (
                    <li key={r} className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={planned}
                  onClick={() => onPlan(m, review.to, review.reasons.join("; "))}
                  className={`${btn} mt-4 ${planned ? "cursor-default border-line text-muted" : "border-amber-500/40 text-amber-300 hover:bg-amber-500/10"}`}
                >
                  <ListPlus size={15} /> Add review to to-do
                </button>
              </>
            ) : (
              <p className="mt-2 text-xs text-muted">Nothing in this player's numbers suggests a role review right now.</p>
            )}
          </section>
        )}
      </aside>
    </div>
  );
}
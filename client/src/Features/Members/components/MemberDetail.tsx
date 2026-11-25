import { useEffect, useRef, type ReactNode } from "react";
import { Eye, Medal, X } from "lucide-react";
import type { Violation } from "../../ClanWars/rules/types";
import { Pill, RoleChip, TownHall } from "../../Roles/components/ui";
import { formatNumber } from "../format";
import type { MemberNote } from "../hooks/useMemberNotes";
import type { Member, MembersData } from "../types";
import { RoundStrip, StarsInline } from "./ui";

interface Props {
  member: Member;
  data: MembersData;
  /** Live rule check results for this player in the current war. */
  violations: Violation[];
  note: MemberNote | undefined;
  onNote: (tag: string, note: string) => void;
  onToggleWatch: (tag: string) => void;
  onToggleBonus: (tag: string) => void;
  onClose: () => void;
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

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-7" aria-label={title}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-xl font-bold text-white">{title}</h3>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const WAR_STATE: Record<string, string> = { preparation: "Preparation day", inWar: "Battle day", warEnded: "War ended" };

/** Slide-over with everything about one player: war, CWL, capital raids, donations and the leader's notes. */
export default function MemberDetail({ member: m, data, violations, note, onNote, onToggleWatch, onToggleBonus, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

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
  const warEnded = data.war?.state === "warEnded";
  const raidEnded = data.raid?.state === "ended";
  const roundsTotal = data.cwl?.roundsTotal ?? 7;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-label={`${m.name} details`} className="h-full w-[min(480px,100vw)] overflow-y-auto border-l border-line bg-black/80 p-6 shadow-2xl">
        {/* header */}
        <div className="flex items-start gap-4">
          <TownHall level={m.townHallLevel} size={64} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-[30px] font-bold leading-tight text-white">{m.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <RoleChip role={m.role} />
              <span className="font-mono text-[11px] text-muted">{m.tag}</span>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close details" className="rounded-md p-1.5 text-muted2 transition hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Tile label="Donated" value={formatNumber(m.donations)} sub="this season" />
          <Tile label="Received" value={formatNumber(m.donationsReceived)} sub="this season" />
          <Tile label="Ratio" value={ratio.toFixed(2)} sub="donated ÷ received" />
          <Tile label="Trophies" value={formatNumber(m.trophies)} />
          <Tile label="Clan rank" value={m.clanRank ? `#${m.clanRank}` : "—"} />
          <Tile label="Town hall" value={m.townHallLevel} />
        </div>

        {/* ---- clan war ---- */}
        <Section title="Clan war" aside={data.war && <Pill tone={data.war.state === "inWar" ? "red" : "muted"}>{(WAR_STATE[data.war.state] ?? data.war.state).toUpperCase()}</Pill>}>
          {!data.war ? (
            <p className="text-xs text-muted">{data.unavailable.includes("war") ? "War data is unavailable — the clan's war log is private." : "No war in progress."}</p>
          ) : !m.war ? (
            <p className="text-xs text-muted">Not in the war against {data.war.opponent ?? "the opponent"}.</p>
          ) : (
            <>
              <p className="text-xs text-muted2">
                Base <span className="font-semibold text-white">#{m.war.position}</span> vs {data.war.opponent ?? "the opponent"} · {m.war.attacksUsed}/{m.war.attacksAvailable} attacks used
                {m.war.attacksUsed < m.war.attacksAvailable && (warEnded ? <span className="text-red-400"> · {m.war.attacksAvailable - m.war.attacksUsed} missed</span> : <span className="text-amber-400"> · {m.war.attacksAvailable - m.war.attacksUsed} left</span>)}
              </p>
              {m.war.attacks.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {m.war.attacks.map((a, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-panel px-3 py-2 text-xs">
                      <span className="text-muted2">
                        Attack {i + 1} → {a.defenderPosition ? `base #${a.defenderPosition}` : "an enemy base"}
                      </span>
                      <span className="flex items-center gap-3">
                        <StarsInline count={a.stars} />
                        <span className="w-9 text-right font-semibold text-white">{a.destruction}%</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-muted2">
                Defense: {m.war.timesAttacked > 0 ? `attacked ${m.war.timesAttacked}×${m.war.bestAgainst ? `, best ${m.war.bestAgainst.stars}★ ${m.war.bestAgainst.destruction}%` : ""}` : "not attacked yet"}
              </p>
              {violations.length > 0 ? (
                <ul className="mt-3 space-y-1.5" aria-label="Rule checks">
                  {violations.map((v) => (
                    <li key={v.id} className="rounded-lg bg-panel px-3 py-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={v.severity === "major" ? "red" : "amber"}>{v.severity === "major" ? "MAJOR" : "MINOR"}</Pill>
                        <Pill tone={v.status === "violated" ? "red" : "amber"}>{v.status === "violated" ? "BROKEN" : "AT RISK"}</Pill>
                        <span className="text-white/90">{v.ruleTitle}</span>
                      </div>
                      <div className="mt-1 text-muted">{v.message}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-gold">No rules broken so far.</p>
              )}
            </>
          )}
        </Section>

        {/* ---- CWL ---- */}
        <Section title="Clan War League" aside={data.cwl && <span className="text-[11px] text-muted">Season {data.cwl.season ?? "?"}</span>}>
          {!data.cwl ? (
            <p className="text-xs text-muted">The clan isn't in a Clan War League right now.</p>
          ) : !m.cwl.registered ? (
            <p className="text-xs text-muted">Not registered for this CWL.</p>
          ) : (
            <>
              <RoundStrip rounds={m.cwl.rounds} total={roundsTotal} />
              <p className="mt-3 text-xs text-muted2">
                {m.cwl.roundsPlayed === 0
                  ? "On the bench so far."
                  : `${m.cwl.roundsPlayed} round${m.cwl.roundsPlayed === 1 ? "" : "s"} played · ${m.cwl.attacksUsed} attack${m.cwl.attacksUsed === 1 ? "" : "s"} · ${m.cwl.starsThisSeason}★${m.cwl.avgDestruction !== null ? ` · ${m.cwl.avgDestruction}% average` : ""}`}
                {m.cwl.missedAttacks > 0 && <span className="text-red-400"> · {m.cwl.missedAttacks} missed</span>}
              </p>
            </>
          )}
        </Section>

        {/* ---- capital ---- */}
        <Section title="Capital raids" aside={data.raid && <Pill tone={raidEnded ? "muted" : "green"}>{raidEnded ? "LAST WEEKEND" : "LIVE"}</Pill>}>
          {!data.raid ? (
            <p className="text-xs text-muted">No raid weekends yet.</p>
          ) : (
            <>
              {m.capital.raid ? (
                <p className="text-xs text-muted2">
                  {m.capital.raid.attacksUsed}/{m.capital.raid.attackLimit} attacks · <span className="font-semibold text-white">{formatNumber(m.capital.raid.looted)}</span> gold looted
                  {m.capital.missedLastWeekend ? <span className="text-red-400"> · {m.capital.missedLastWeekend} missed</span> : null}
                </p>
              ) : (
                <p className="text-xs text-muted">Not listed in the latest raid weekend.</p>
              )}
              <p className="mt-2 text-xs text-muted2">
                Attacked in {m.capital.weekendsParticipated} of the last {m.capital.weekendsTracked} weekends · {formatNumber(m.capital.lootedTracked)} gold in total
              </p>
            </>
          )}
        </Section>

        {/* ---- leader's notes ---- */}
        <Section title="Leader notes">
          <textarea
            value={note?.note ?? ""}
            onChange={(e) => onNote(m.tag, e.target.value)}
            rows={3}
            aria-label="Leader note"
            placeholder="Private note about this member — only leaders see this."
            className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-white placeholder:text-muted focus:border-gold/50 focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onToggleWatch(m.tag)}
              aria-pressed={Boolean(note?.watch)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${note?.watch ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-line text-muted2 hover:text-white"}`}
            >
              <Eye size={13} /> {note?.watch ? "On watch list" : "Add to watch list"}
            </button>
            <button
              type="button"
              onClick={() => onToggleBonus(m.tag)}
              aria-pressed={Boolean(note?.bonus)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${note?.bonus ? "border-gold/50 bg-gold/10 text-gold" : "border-line text-muted2 hover:text-white"}`}
            >
              <Medal size={13} /> {note?.bonus ? "CWL bonus holder" : "Mark as CWL bonus holder"}
            </button>
          </div>
        </Section>
      </aside>
    </div>
  );
}
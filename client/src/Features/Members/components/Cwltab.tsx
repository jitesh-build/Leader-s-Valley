import { Medal, Star } from "lucide-react";
import DataTable, { type Column } from "./DataTable";
import { BreakBadge, Frac, MemberCell, RuleBreakList } from "./ui";
import type { Member } from "../types";

export default function CwlTab({ rows }: { rows: Member[] }) {
  const columns: Column<Member>[] = [
    { id: "member", header: "Member", firstSort: "asc", sortValue: (m) => m.name.toLowerCase(), cell: (m) => <MemberCell member={m} /> },
    {
      id: "lineup",
      header: "This season",
      sortValue: (m) => (m.cwl.inLineup ? 1 : 0),
      cell: (m) =>
        m.cwl.inLineup ? (
          <span className="rounded bg-gold/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-gold">IN LINEUP</span>
        ) : (
          <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-wider text-muted">BENCHED</span>
        ),
    },
    {
      id: "rounds",
      header: "Rounds",
      align: "right",
      sortValue: (m) => m.cwl.roundsPlayed,
      cell: (m) => (m.cwl.inLineup ? <span><span className="font-semibold text-white">{m.cwl.roundsPlayed}</span><span className="text-muted">/7</span></span> : <span className="text-muted/70">—</span>),
    },
    {
      id: "attacks",
      header: "Attacks",
      align: "right",
      sortValue: (m) => m.cwl.roundsPlayed - m.cwl.attacksUsed,
      cell: (m) => (m.cwl.inLineup ? <Frac used={m.cwl.attacksUsed} total={m.cwl.roundsPlayed} /> : <span className="text-muted/70">—</span>),
    },
    {
      id: "stars",
      header: "Stars (season)",
      align: "right",
      sortValue: (m) => m.cwl.starsThisSeason,
      cell: (m) =>
        m.cwl.inLineup ? (
          <span className="inline-flex items-center gap-1 font-semibold text-white">
            <Star size={12} className="fill-gold text-gold" />
            {m.cwl.starsThisSeason}
          </span>
        ) : (
          <span className="text-muted/70">—</span>
        ),
    },
    {
      id: "avg",
      header: "Avg ★",
      align: "right",
      sortValue: (m) => (m.cwl.attacksUsed ? m.cwl.starsThisSeason / m.cwl.attacksUsed : 0),
      cell: (m) => <span className="text-muted2">{m.cwl.attacksUsed ? (m.cwl.starsThisSeason / m.cwl.attacksUsed).toFixed(2) : "—"}</span>,
    },
    { id: "all", header: "Stars (all-time)", align: "right", sortValue: (m) => m.cwl.starsAllTime, cell: (m) => <span className="text-muted2">{m.cwl.starsAllTime}</span> },
    {
      id: "bonus",
      header: "Bonus",
      align: "center",
      sortValue: (m) => (m.cwl.bonusHolder ? 1000 : 0) + m.cwl.bonusesReceived,
      cell: (m) => (
        <div className="flex flex-col items-center gap-0.5">
          {m.cwl.bonusHolder ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold ring-1 ring-gold/30">
              <Medal size={11} /> HOLDER
            </span>
          ) : (
            <span className="text-xs text-muted/70">—</span>
          )}
          <span className="text-[10px] text-muted">{m.cwl.bonusesReceived} past</span>
        </div>
      ),
    },
    { id: "breaks", header: "Rule breaks", align: "right", sortValue: (m) => m.cwl.ruleBreaks.length, cell: (m) => <BreakBadge count={m.cwl.ruleBreaks.length} /> },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(m) => m.tag}
      defaultSort={{ id: "stars", dir: "desc" }}
      minWidth={1000}
      renderExpanded={(m) => (
        <div className="grid gap-5 md:grid-cols-2">
          <RuleBreakList breaks={m.cwl.ruleBreaks} emptyText={m.cwl.inLineup ? "No rule breaks this season." : "Not in this season's lineup."} />
          <div>
            <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">HISTORY</div>
            <p className="mt-2 text-xs text-muted2">
              {m.cwl.seasonsPlayed} season{m.cwl.seasonsPlayed === 1 ? "" : "s"} played · received bonus medals {m.cwl.bonusesReceived} time
              {m.cwl.bonusesReceived === 1 ? "" : "s"}.
            </p>
          </div>
        </div>
      )}
    />
  );
}
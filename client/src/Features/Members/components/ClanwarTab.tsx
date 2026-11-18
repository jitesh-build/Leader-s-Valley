import { Star } from "lucide-react";
import DataTable, { type Column } from "./DataTable";
import { BreakBadge, Frac, MemberCell, MiniBars, RuleBreakList } from "./ui";
import type { Member } from "../types";

export interface LiveWar {
  broken: number;
  atRisk: number;
}

interface Props {
  rows: Member[];
  /** Live rule check of the war happening right now (from the Clan War page's rule engine). */
  liveByTag: Map<string, LiveWar>;
}

export default function ClanWarTab({ rows, liveByTag }: Props) {
  const columns: Column<Member>[] = [
    { id: "member", header: "Member", firstSort: "asc", sortValue: (m) => m.name.toLowerCase(), cell: (m) => <MemberCell member={m} /> },
    {
      id: "wars",
      header: "Wars",
      align: "right",
      sortValue: (m) => m.war.warsParticipated,
      cell: (m) => (
        <div>
          <span className="font-semibold text-white">{m.war.warsParticipated}</span>
          <span className="text-muted">/{m.war.warsEligible}</span>
          <div className="text-[10px] text-muted">{Math.round((m.war.warsParticipated / m.war.warsEligible) * 100)}% played</div>
        </div>
      ),
    },
    {
      id: "attacks",
      header: "Attacks",
      align: "right",
      sortValue: (m) => m.war.attacksAvailable - m.war.attacksUsed,
      cell: (m) => <Frac used={m.war.attacksUsed} total={m.war.attacksAvailable} />,
    },
    {
      id: "stars",
      header: "Stars",
      align: "right",
      sortValue: (m) => m.war.stars,
      cell: (m) => (
        <span className="inline-flex items-center gap-1 font-semibold text-white">
          <Star size={12} className="fill-gold text-gold" />
          {m.war.stars}
        </span>
      ),
    },
    { id: "three", header: "3★ hits", align: "right", sortValue: (m) => m.war.threeStars, cell: (m) => <span className="text-white">{m.war.threeStars}</span> },
    {
      id: "avg",
      header: "Avg ★",
      align: "right",
      sortValue: (m) => (m.war.attacksUsed ? m.war.stars / m.war.attacksUsed : 0),
      cell: (m) => <span className="text-muted2">{m.war.attacksUsed ? (m.war.stars / m.war.attacksUsed).toFixed(2) : "—"}</span>,
    },
    { id: "dest", header: "Avg dest.", align: "right", sortValue: (m) => m.war.avgDestruction, cell: (m) => <span className="text-muted2">{m.war.avgDestruction}%</span> },
    {
      id: "recent",
      header: "Last 6 wars",
      align: "right",
      cell: (m) => <MiniBars values={m.war.recentStars} max={6} title="Stars per war, oldest → newest" />,
    },
    {
      id: "live",
      header: "This war",
      align: "right",
      sortValue: (m) => (liveByTag.get(m.tag)?.broken ?? 0) * 100 + (liveByTag.get(m.tag)?.atRisk ?? 0),
      cell: (m) => {
        const live = liveByTag.get(m.tag);
        if (!live) return <span className="text-xs text-muted/70">—</span>;
        return (
          <div className="flex flex-col items-end gap-0.5 text-[11px] font-semibold">
            {live.broken > 0 && <span className="text-red-400">{live.broken} broken</span>}
            {live.atRisk > 0 && <span className="text-amber-400">{live.atRisk} at risk</span>}
          </div>
        );
      },
    },
    { id: "breaks", header: "Rule breaks", align: "right", sortValue: (m) => m.war.ruleBreaks.length, cell: (m) => <BreakBadge count={m.war.ruleBreaks.length} /> },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(m) => m.tag}
      defaultSort={{ id: "stars", dir: "desc" }}
      minWidth={1050}
      renderExpanded={(m) => <RuleBreakList breaks={m.war.ruleBreaks} />}
    />
  );
}
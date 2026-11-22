import { Star } from "lucide-react";
import DataTable, { type Column } from "./DataTable";
import { Dash, Frac, MemberCell } from "./ui";
import type { Member } from "../types";

export interface LiveWar {
  broken: number;
  atRisk: number;
}

interface Props {
  rows: Member[];
  /** Live rule check of the war happening right now (from the Clan War page's rules + engine). */
  liveByTag: Map<string, LiveWar>;
  /** The war is over, so unused attacks count as missed. */
  warEnded: boolean;
  onOpen: (member: Member) => void;
}

export default function ClanWarTab({ rows, liveByTag, warEnded, onOpen }: Props) {
  const columns: Column<Member>[] = [
    { id: "member", header: "Member", firstSort: "asc", sortValue: (m) => m.name.toLowerCase(), cell: (m) => <MemberCell member={m} /> },
    {
      id: "pos",
      header: "Base",
      align: "right",
      firstSort: "asc",
      sortValue: (m) => m.war?.position ?? 999,
      cell: (m) => (m.war ? <span className="font-semibold text-white">#{m.war.position}</span> : <Dash />),
    },
    {
      id: "attacks",
      header: "Attacks",
      align: "right",
      sortValue: (m) => (m.war ? m.war.attacksAvailable - m.war.attacksUsed : -1),
      cell: (m) => (m.war ? <Frac used={m.war.attacksUsed} total={m.war.attacksAvailable} final={warEnded} /> : <Dash />),
    },
    {
      id: "hits",
      header: "Hits",
      align: "right",
      cell: (m) =>
        m.war && m.war.attacks.length > 0 ? (
          <span className="inline-flex items-center gap-2">
            {m.war.attacks.map((a, i) => (
              <span key={i} className={`font-semibold ${a.stars === 3 ? "text-gold" : a.stars === 0 ? "text-red-400" : "text-white"}`} title={`${a.stars} stars, ${a.destruction}%${a.defenderPosition ? `, base #${a.defenderPosition}` : ""}`}>
                {a.stars}★
              </span>
            ))}
          </span>
        ) : (
          <Dash />
        ),
    },
    {
      id: "stars",
      header: "Stars",
      align: "right",
      sortValue: (m) => m.war?.stars ?? -1,
      cell: (m) =>
        m.war ? (
          <span className="inline-flex items-center gap-1 font-semibold text-white">
            <Star size={12} className="fill-gold text-gold" />
            {m.war.stars}
          </span>
        ) : (
          <Dash />
        ),
    },
    { id: "three", header: "3★ hits", align: "right", sortValue: (m) => m.war?.threeStars ?? -1, cell: (m) => (m.war ? <span className="text-white">{m.war.threeStars}</span> : <Dash />) },
    {
      id: "dest",
      header: "Avg dest.",
      align: "right",
      sortValue: (m) => m.war?.avgDestruction ?? -1,
      cell: (m) => (m.war?.avgDestruction != null ? <span className="text-muted2">{m.war.avgDestruction}%</span> : <Dash />),
    },
    {
      id: "defense",
      header: "Defense",
      align: "right",
      sortValue: (m) => m.war?.timesAttacked ?? -1,
      cell: (m) =>
        m.war ? (
          m.war.timesAttacked > 0 ? (
            <div className="text-xs">
              <span className="text-white">{m.war.timesAttacked}×</span>
              {m.war.bestAgainst && <div className="text-[10px] text-muted">best {m.war.bestAgainst.stars}★ {m.war.bestAgainst.destruction}%</div>}
            </div>
          ) : (
            <span className="text-xs text-muted2">not hit</span>
          )
        ) : (
          <Dash />
        ),
    },
    {
      id: "live",
      header: "Rules",
      align: "right",
      sortValue: (m) => (liveByTag.get(m.tag)?.broken ?? 0) * 100 + (liveByTag.get(m.tag)?.atRisk ?? 0),
      cell: (m) => {
        const live = liveByTag.get(m.tag);
        if (!live) return <Dash />;
        return (
          <div className="flex flex-col items-end gap-0.5 text-[11px] font-semibold">
            {live.broken > 0 && <span className="text-red-400">{live.broken} broken</span>}
            {live.atRisk > 0 && <span className="text-amber-400">{live.atRisk} at risk</span>}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(m) => m.tag}
      defaultSort={{ id: "stars", dir: "desc" }}
      minWidth={1000}
      onOpen={onOpen}
      openLabel={(m) => `Open ${m.name}`}
    />
  );
}
import { Medal, Star } from "lucide-react";
import { Pill } from "../../Roles/components/ui";
import DataTable, { type Column } from "./DataTable";
import { Dash, Frac, MemberCell, RoundStrip } from "./ui";
import type { Member } from "../types";

interface Props {
  rows: Member[];
  /** 7 for a normal CWL. */
  roundsTotal: number;
  isBonus: (tag: string) => boolean;
  onOpen: (member: Member) => void;
}

export default function CwlTab({ rows, roundsTotal, isBonus, onOpen }: Props) {
  const columns: Column<Member>[] = [
    { id: "member", header: "Member", firstSort: "asc", sortValue: (m) => m.name.toLowerCase(), cell: (m) => <MemberCell member={m} /> },
    {
      id: "status",
      header: "This season",
      sortValue: (m) => (m.cwl.roundsPlayed > 0 ? 2 : m.cwl.registered ? 1 : 0),
      cell: (m) =>
        m.cwl.roundsPlayed > 0 ? <Pill tone="gold">IN LINEUP</Pill> : m.cwl.registered ? <Pill tone="muted">ON BENCH</Pill> : <Pill tone="muted">NOT IN CWL</Pill>,
    },
    {
      id: "rounds",
      header: "Rounds",
      sortValue: (m) => m.cwl.roundsPlayed,
      cell: (m) => (m.cwl.registered ? <RoundStrip rounds={m.cwl.rounds} total={roundsTotal} /> : <Dash />),
    },
    {
      id: "attacks",
      header: "Attacks",
      align: "right",
      sortValue: (m) => m.cwl.missedAttacks,
      cell: (m) => (m.cwl.roundsPlayed > 0 ? <Frac used={m.cwl.attacksUsed} total={m.cwl.roundsPlayed} final={m.cwl.missedAttacks > 0} /> : <Dash />),
    },
    {
      id: "stars",
      header: "Stars",
      align: "right",
      sortValue: (m) => m.cwl.starsThisSeason,
      cell: (m) =>
        m.cwl.roundsPlayed > 0 ? (
          <span className="inline-flex items-center gap-1 font-semibold text-white">
            <Star size={12} className="fill-gold text-gold" />
            {m.cwl.starsThisSeason}
          </span>
        ) : (
          <Dash />
        ),
    },
    {
      id: "avg",
      header: "Avg ★",
      align: "right",
      sortValue: (m) => (m.cwl.attacksUsed ? m.cwl.starsThisSeason / m.cwl.attacksUsed : -1),
      cell: (m) => (m.cwl.attacksUsed ? <span className="text-muted2">{(m.cwl.starsThisSeason / m.cwl.attacksUsed).toFixed(2)}</span> : <Dash />),
    },
    {
      id: "dest",
      header: "Avg dest.",
      align: "right",
      sortValue: (m) => m.cwl.avgDestruction ?? -1,
      cell: (m) => (m.cwl.avgDestruction != null ? <span className="text-muted2">{m.cwl.avgDestruction}%</span> : <Dash />),
    },
    {
      id: "bonus",
      header: "Bonus",
      align: "center",
      sortValue: (m) => (isBonus(m.tag) ? 1 : 0),
      cell: (m) =>
        isBonus(m.tag) ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold ring-1 ring-gold/30">
            <Medal size={11} /> HOLDER
          </span>
        ) : (
          <Dash />
        ),
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
      emptyText="No members match your filters."
    />
  );
}
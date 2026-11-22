import { Eye } from "lucide-react";
import DataTable, { type Column } from "./DataTable";
import { Dash, MemberCell } from "./ui";
import { formatNumber } from "../format";
import type { MemberNote } from "../hooks/useMemberNotes";
import type { Member } from "../types";

interface Props {
  rows: Member[];
  notes: Record<string, MemberNote>;
  onOpen: (member: Member) => void;
}

const ratio = (m: Member): number => (m.donationsReceived > 0 ? m.donations / m.donationsReceived : m.donations);

/** Donations, trophies and the leader's notes. */
export default function OtherTab({ rows, notes, onOpen }: Props) {
  const columns: Column<Member>[] = [
    { id: "member", header: "Member", firstSort: "asc", sortValue: (m) => m.name.toLowerCase(), cell: (m) => <MemberCell member={m} /> },
    { id: "given", header: "Donated", align: "right", sortValue: (m) => m.donations, cell: (m) => <span className="font-semibold text-white">{formatNumber(m.donations)}</span> },
    { id: "received", header: "Received", align: "right", sortValue: (m) => m.donationsReceived, cell: (m) => <span className="text-muted2">{formatNumber(m.donationsReceived)}</span> },
    {
      id: "ratio",
      header: "Ratio",
      align: "right",
      sortValue: ratio,
      cell: (m) => {
        const v = ratio(m);
        return <span className={`font-semibold ${v >= 1 ? "text-green-400" : v >= 0.5 ? "text-muted2" : "text-amber-400"}`}>{v.toFixed(2)}</span>;
      },
    },
    { id: "trophies", header: "Trophies", align: "right", sortValue: (m) => m.trophies, cell: (m) => <span className="text-white">{formatNumber(m.trophies)}</span> },
    { id: "rank", header: "Clan rank", align: "right", firstSort: "asc", sortValue: (m) => m.clanRank ?? 999, cell: (m) => (m.clanRank ? <span className="text-muted2">#{m.clanRank}</span> : <Dash />) },
    {
      id: "flag",
      header: "Notes",
      align: "center",
      sortValue: (m) => (notes[m.tag]?.watch ? 2 : 0) + (notes[m.tag]?.note ? 1 : 0),
      cell: (m) => {
        const n = notes[m.tag];
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px]">
            {n?.watch && <Eye size={13} className="text-amber-400" aria-label="On watch list" />}
            {n?.note ? <span className="text-muted2">note</span> : !n?.watch && <span className="text-muted/70">—</span>}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(m) => m.tag}
      defaultSort={{ id: "given", dir: "desc" }}
      minWidth={850}
      onOpen={onOpen}
      openLabel={(m) => `Open ${m.name}`}
    />
  );
}
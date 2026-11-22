import { Pill } from "../../Roles/components/ui";
import DataTable, { type Column } from "./DataTable";
import { Dash, Frac, MemberCell } from "./ui";
import { formatNumber } from "../format";
import type { Member } from "../types";

interface Props {
  rows: Member[];
  /** The latest raid weekend is over, so unused attacks count as missed. */
  weekendEnded: boolean;
  weekendsTracked: number;
  onOpen: (member: Member) => void;
}

export default function CapitalTab({ rows, weekendEnded, weekendsTracked, onOpen }: Props) {
  const columns: Column<Member>[] = [
    { id: "member", header: "Member", firstSort: "asc", sortValue: (m) => m.name.toLowerCase(), cell: (m) => <MemberCell member={m} /> },
    {
      id: "attacks",
      header: "Raid attacks",
      align: "right",
      sortValue: (m) => (m.capital.raid ? m.capital.raid.attackLimit - m.capital.raid.attacksUsed : -1),
      cell: (m) => (m.capital.raid ? <Frac used={m.capital.raid.attacksUsed} total={m.capital.raid.attackLimit} final={weekendEnded} /> : <Dash />),
    },
    {
      id: "looted",
      header: "Gold looted",
      align: "right",
      sortValue: (m) => m.capital.raid?.looted ?? -1,
      cell: (m) => (m.capital.raid ? <span className="font-semibold text-white">{formatNumber(m.capital.raid.looted)}</span> : <Dash />),
    },
    {
      id: "avg",
      header: "Per attack",
      align: "right",
      sortValue: (m) => (m.capital.raid?.attacksUsed ? m.capital.raid.looted / m.capital.raid.attacksUsed : -1),
      cell: (m) => (m.capital.raid?.attacksUsed ? <span className="text-muted2">{formatNumber(Math.round(m.capital.raid.looted / m.capital.raid.attacksUsed))}</span> : <Dash />),
    },
    {
      id: "weekends",
      header: `Last ${weekendsTracked || 0} weekends`,
      align: "right",
      sortValue: (m) => m.capital.weekendsParticipated,
      cell: (m) => (
        <span>
          <span className="text-white">{m.capital.weekendsParticipated}</span>
          <span className="text-muted">/{m.capital.weekendsTracked}</span>
        </span>
      ),
    },
    {
      id: "total",
      header: "Gold (all tracked)",
      align: "right",
      sortValue: (m) => m.capital.lootedTracked,
      cell: (m) => <span className="font-semibold text-gold">{formatNumber(m.capital.lootedTracked)}</span>,
    },
    {
      id: "status",
      header: "Status",
      align: "right",
      sortValue: (m) => (m.capital.raid ? m.capital.raid.attackLimit - m.capital.raid.attacksUsed : -1),
      cell: (m) => {
        const r = m.capital.raid;
        if (!r) return <Pill tone="muted">NOT LISTED</Pill>;
        const left = Math.max(0, r.attackLimit - r.attacksUsed);
        if (left === 0) return <Pill tone="green">DONE</Pill>;
        return weekendEnded ? <Pill tone="red">MISSED {left}</Pill> : <Pill tone="amber">{left} LEFT</Pill>;
      },
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(m) => m.tag}
      defaultSort={{ id: "looted", dir: "desc" }}
      minWidth={950}
      onOpen={onOpen}
      openLabel={(m) => `Open ${m.name}`}
    />
  );
}
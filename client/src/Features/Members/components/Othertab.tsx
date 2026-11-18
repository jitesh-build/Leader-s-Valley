import { Eye } from "lucide-react";
import DataTable, { type Column } from "./DataTable";
import { MemberCell, MiniBars } from "./ui";
import { daysSince, formatDate, formatNumber, formatTenure } from "../format";
import type { MemberNote } from "../hooks/useMemberNotes";
import type { Member } from "../types";

const GAMES_MAX = 4000;

interface Props {
  rows: Member[];
  notes: Record<string, MemberNote>;
  onNote: (tag: string, note: string) => void;
  onToggleWatch: (tag: string) => void;
}

const ratio = (m: Member): number => (m.donationsReceived > 0 ? m.donations / m.donationsReceived : m.donations);

export default function OtherTab({ rows, notes, onNote, onToggleWatch }: Props) {
  const columns: Column<Member>[] = [
    { id: "member", header: "Member", firstSort: "asc", sortValue: (m) => m.name.toLowerCase(), cell: (m) => <MemberCell member={m} /> },
    {
      id: "games",
      header: "Clan games",
      sortValue: (m) => m.games.clanGamesPoints,
      cell: (m) => (
        <div className="w-36">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-white">{formatNumber(m.games.clanGamesPoints)}</span>
            <span className="text-muted">/ {formatNumber(GAMES_MAX)}</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${m.games.clanGamesPoints >= GAMES_MAX ? "bg-green-400" : "bg-gold"}`}
              style={{ width: `${Math.min(100, (m.games.clanGamesPoints / GAMES_MAX) * 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      id: "history",
      header: "Previous 4",
      align: "right",
      cell: (m) => <MiniBars values={m.games.clanGamesHistory} max={GAMES_MAX} title="Points in the previous 4 events, oldest → newest" />,
    },
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
    { id: "tenure", header: "In clan", align: "right", sortValue: (m) => daysSince(m.joinedAt), cell: (m) => <span className="text-muted2">{formatTenure(daysSince(m.joinedAt))}</span> },
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
      defaultSort={{ id: "games", dir: "desc" }}
      minWidth={1050}
      renderExpanded={(m) => {
        const n = notes[m.tag];
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">LEADER NOTE</div>
              <textarea
                value={n?.note ?? ""}
                onChange={(e) => onNote(m.tag, e.target.value)}
                rows={3}
                placeholder="Private note about this member — only leaders see this."
                className="mt-2 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-gold/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onToggleWatch(m.tag)}
                aria-pressed={Boolean(n?.watch)}
                className={`mt-2 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  n?.watch ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-line text-muted2 hover:text-white"
                }`}
              >
                <Eye size={13} /> {n?.watch ? "On watch list" : "Add to watch list"}
              </button>
            </div>
            <div className="text-xs text-muted2">
              <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">DETAILS</div>
              <ul className="mt-2 space-y-1.5">
                <li>Joined the clan {formatDate(m.joinedAt)} · {formatTenure(daysSince(m.joinedAt))} ago</li>
                <li>Clan games history: {m.games.clanGamesHistory.map((p) => formatNumber(p)).join(" · ")}</li>
                <li>
                  Donated {formatNumber(m.donations)}, received {formatNumber(m.donationsReceived)} this season
                </li>
              </ul>
            </div>
          </div>
        );
      }}
    />
  );
}
import DataTable, { type Column } from "./DataTable";
import { BreakBadge, Frac, MemberCell, RuleBreakList } from "./ui";
import { formatNumber } from "../format";
import type { Member } from "../types";

export default function CapitalTab({ rows }: { rows: Member[] }) {
  const columns: Column<Member>[] = [
    { id: "member", header: "Member", firstSort: "asc", sortValue: (m) => m.name.toLowerCase(), cell: (m) => <MemberCell member={m} /> },
    {
      id: "attacks",
      header: "Raid attacks",
      align: "right",
      sortValue: (m) => m.capital.attackLimit - m.capital.attacksUsed,
      cell: (m) => <Frac used={m.capital.attacksUsed} total={m.capital.attackLimit} />,
    },
    { id: "looted", header: "Gold looted", align: "right", sortValue: (m) => m.capital.goldLooted, cell: (m) => <span className="font-semibold text-white">{formatNumber(m.capital.goldLooted)}</span> },
    {
      id: "avg",
      header: "Per attack",
      align: "right",
      sortValue: (m) => (m.capital.attacksUsed ? m.capital.goldLooted / m.capital.attacksUsed : 0),
      cell: (m) => <span className="text-muted2">{m.capital.attacksUsed ? formatNumber(Math.round(m.capital.goldLooted / m.capital.attacksUsed)) : "—"}</span>,
    },
    {
      id: "weekends",
      header: "Weekends",
      align: "right",
      sortValue: (m) => m.capital.raidsParticipated,
      cell: (m) => (
        <span>
          <span className="text-white">{m.capital.raidsParticipated}</span>
          <span className="text-muted">/{m.capital.raidsEligible}</span>
        </span>
      ),
    },
    {
      id: "contrib",
      header: "Gold contributed",
      align: "right",
      sortValue: (m) => m.capital.goldContributedTotal,
      cell: (m) => <span className="font-semibold text-gold">{formatNumber(m.capital.goldContributedTotal)}</span>,
    },
    {
      id: "top",
      header: "Top district",
      sortValue: (m) => m.capital.contributions[0]?.district ?? "",
      cell: (m) => <span className="text-muted2">{m.capital.contributions[0]?.district ?? "—"}</span>,
    },
    { id: "breaks", header: "Rule breaks", align: "right", sortValue: (m) => m.capital.ruleBreaks.length, cell: (m) => <BreakBadge count={m.capital.ruleBreaks.length} /> },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(m) => m.tag}
      defaultSort={{ id: "contrib", dir: "desc" }}
      minWidth={1000}
      renderExpanded={(m) => {
        const total = m.capital.goldContributedTotal || 1;
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">CAPITAL GOLD CONTRIBUTED BY DISTRICT</div>
              {m.capital.contributions.length === 0 ? (
                <p className="mt-2 text-xs text-muted">No contributions recorded.</p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {m.capital.contributions.map((c) => (
                    <li key={c.district} className="text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted2">{c.district}</span>
                        <span className="font-semibold text-white">
                          {formatNumber(c.amount)} <span className="font-normal text-muted">· {Math.round((c.amount / total) * 100)}%</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${(c.amount / total) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <RuleBreakList breaks={m.capital.ruleBreaks} />
          </div>
        );
      }}
    />
  );
}
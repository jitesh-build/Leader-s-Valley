import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";

export interface Column<T> {
  id: string;
  header: string;
  align?: "left" | "right" | "center";
  /** Makes the column sortable. */
  sortValue?: (row: T) => number | string;
  /** Direction used the first time the header is clicked. Default "desc". */
  firstSort?: "asc" | "desc";
  cell: (row: T) => ReactNode;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  defaultSort?: { id: string; dir: "asc" | "desc" };
  /** Clicking a row (or its arrow) opens this row's details. */
  onOpen?: (row: T) => void;
  openLabel?: (row: T) => string;
  emptyText?: string;
  minWidth?: number;
}

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

export default function DataTable<T>({ rows, columns, rowKey, defaultSort, onOpen, openLabel, emptyText = "No members match your filters.", minWidth = 900 }: Props<T>) {
  const [sort, setSort] = useState<{ id: string; dir: "asc" | "desc" } | null>(defaultSort ?? null);

  const sorted = useMemo(() => {
    const col = sort ? columns.find((c) => c.id === sort.id) : undefined;
    if (!sort || !col?.sortValue) return rows;
    const sv = col.sortValue;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = sv(a);
      const y = sv(b);
      if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
      return String(x).localeCompare(String(y)) * dir;
    });
  }, [rows, columns, sort]);

  function toggleSort(col: Column<T>) {
    if (!col.sortValue) return;
    setSort((prev) => (prev?.id === col.id ? { id: col.id, dir: prev.dir === "asc" ? "desc" : "asc" } : { id: col.id, dir: col.firstSort ?? "desc" }));
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-card">
      <table className="w-full border-collapse" style={{ minWidth }}>
        <thead>
          <tr className="bg-white/[0.02]">
            {columns.map((c) => {
              const active = sort?.id === c.id;
              return (
                <th
                  key={c.id}
                  scope="col"
                  aria-sort={active ? (sort?.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={`px-4 py-3 text-[10px] font-semibold tracking-[0.14em] ${ALIGN[c.align ?? "left"]} ${active ? "text-gold" : "text-muted"}`}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c)}
                      className={`inline-flex items-center gap-1 uppercase transition hover:text-white ${c.align === "right" ? "flex-row-reverse" : ""}`}
                    >
                      {c.header}
                      {active && (sort?.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </button>
                  ) : (
                    <span className="uppercase">{c.header}</span>
                  )}
                </th>
              );
            })}
            {onOpen && <th className="w-10" aria-label="Details" />}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onOpen ? 1 : 0)} className="border-t border-line px-4 py-10 text-center text-sm text-muted">
                {emptyText}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onOpen ? () => onOpen(row) : undefined}
                className={`border-t border-line transition hover:bg-white/[0.03] ${onOpen ? "cursor-pointer" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.id} className={`px-4 py-3 align-middle text-sm ${ALIGN[c.align ?? "left"]}`}>
                    {c.cell(row)}
                  </td>
                ))}
                {onOpen && (
                  <td className="px-2 text-center">
                    <button
                      type="button"
                      aria-label={openLabel ? openLabel(row) : "Open details"}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(row);
                      }}
                      className="rounded-md p-1 text-muted transition hover:bg-white/10 hover:text-white"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
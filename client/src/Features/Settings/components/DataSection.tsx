import { useMemo, useRef } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { useLayoutContext } from "../../Layout/useLayoutContext";
import { DATA_ITEMS, downloadBackup, formatBytes, readRaw, removeKeys, restoreBackup } from "../dataStorage";
import { Chip, SectionCard, ghostButton } from "./ui";

export default function DataSection() {
  const { showToast } = useLayoutContext();
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(
    () =>
      DATA_ITEMS.map((item) => {
        const raw = readRaw(item.key);
        return { ...item, used: raw !== null, size: raw ? new Blob([raw]).size : 0 };
      }),
    []
  );

  // Pages keep their data in memory while open, so reload after a reset/import to make everything agree.
  const reloadSoon = (): void => void setTimeout(() => window.location.reload(), 700);

  function resetKeys(keys: string[], message: string) {
    removeKeys(keys);
    showToast(message);
    reloadSoon();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const result = restoreBackup(await file.text());
    if (result.ok) {
      showToast(`Restored ${result.restored} item${result.restored === 1 ? "" : "s"} — reloading…`);
      reloadSoon();
    } else {
      showToast(result.error);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const total = rows.reduce((s, r) => s + r.size, 0);

  return (
    <SectionCard
      id="data"
      eyebrow="STORAGE"
      title="Your data"
      description="Until there's a backend, your rules, notes and settings live in this browser only. Clearing browser data or switching device would lose them — download a backup to keep them safe."
    >
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={downloadBackup} className={`${ghostButton} flex items-center gap-2`}>
          <Download size={15} /> Download backup
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className={`${ghostButton} flex items-center gap-2`}>
          <Upload size={15} /> Restore from file
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        <span className="ml-auto text-xs text-muted">{formatBytes(total)} stored</span>
      </div>

      <ul className="mt-5 divide-y divide-line overflow-hidden rounded-xl bg-panel">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white">{r.label}</div>
              <div className="text-[11px] text-muted">{r.description}</div>
            </div>
            <span className="hidden w-16 text-right text-xs text-muted2 sm:block">{r.used ? formatBytes(r.size) : "—"}</span>
            <Chip tone={r.used ? "green" : "muted"}>{r.used ? "SAVED" : "EMPTY"}</Chip>
            <button
              type="button"
              disabled={!r.used}
              onClick={() => {
                if (confirm(`Reset “${r.label}”? This can't be undone.`)) resetKeys([r.key], `${r.label} reset — reloading…`);
              }}
              aria-label={`Reset ${r.label}`}
              className="rounded-md p-1.5 text-muted transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-red-400">Reset everything</div>
          <div className="text-[11px] text-muted">Removes every item above and returns the app to its defaults.</div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset ALL saved data in this browser? Download a backup first if you might need it.")) {
              resetKeys(DATA_ITEMS.map((i) => i.key), "Everything reset — reloading…");
            }
          }}
          className="shrink-0 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
        >
          Reset all
        </button>
      </div>
    </SectionCard>
  );
}
import React, { useState } from "react";
import { WAR_MODE_SIZES, WarMode } from "../types";

interface CreateWarFormProps {
  onCreate: (input: { name: string; mode: WarMode; size?: number; leagueTier?: string }) => Promise<void>;
  onCancel: () => void;
}

const MODE_OPTIONS: { mode: WarMode; label: string; hint: string }[] = [
  { mode: "5v5", label: "5 v 5", hint: "Master I or below" },
  { mode: "15v15", label: "15 v 15", hint: "Standard · all leagues" },
  { mode: "30v30", label: "30 v 30", hint: "Master I or below" },
  { mode: "custom", label: "Custom", hint: "Set your own size" },
];

export default function CreateWarForm({ onCreate, onCancel }: CreateWarFormProps): React.ReactElement {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<WarMode>("15v15");
  const [customSize, setCustomSize] = useState("15");
  const [leagueTier, setLeagueTier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give this war a name, e.g. \"August 2026 CWL\"");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const size = mode === "custom" ? Number(customSize) : undefined;
      await onCreate({ name: trimmed, mode, ...(size !== undefined ? { size } : {}), leagueTier });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create war");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg rounded-lg border border-base-border bg-base-panel p-6 shadow-xl"
    >
      <h2 className="mb-4 font-display text-lg uppercase tracking-wide text-ink-primary">Start a new CWL</h2>

      <label className="mb-3 block">
        <span className="mb-1 block text-xs uppercase tracking-widest text-ink-faint">Season / war name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="August 2026 CWL"
          className="w-full rounded border border-base-border bg-base-panel2 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-team"
          autoFocus
        />
      </label>

      <div className="mb-3">
        <span className="mb-1 block text-xs uppercase tracking-widest text-ink-faint">War size</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MODE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.mode}
              onClick={() => setMode(opt.mode)}
              className={[
                "rounded border px-2 py-2 text-center transition",
                mode === opt.mode
                  ? "border-team bg-team/10 text-team-bright"
                  : "border-base-border text-ink-muted hover:border-borderLight",
              ].join(" ")}
            >
              <div className="font-display text-sm">{opt.label}</div>
              <div className="text-[10px] text-ink-faint">{opt.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {mode === "custom" ? (
        <label className="mb-3 block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-ink-faint">Bases per side</span>
          <input
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            inputMode="numeric"
            className="w-24 rounded border border-base-border bg-base-panel2 px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-1 focus:ring-team"
          />
        </label>
      ) : (
        <p className="mb-3 text-xs text-ink-faint">
          {WAR_MODE_SIZES[mode as Exclude<WarMode, "custom">]} bases per side.
        </p>
      )}

      <label className="mb-4 block">
        <span className="mb-1 block text-xs uppercase tracking-widest text-ink-faint">League tier (optional)</span>
        <input
          value={leagueTier}
          onChange={(e) => setLeagueTier(e.target.value)}
          placeholder="Crystal II"
          className="w-full rounded border border-base-border bg-base-panel2 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-team"
        />
      </label>

      {error ? <p className="mb-3 text-sm text-enemy-bright">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-4 py-2 text-sm text-ink-muted hover:text-ink-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-team px-4 py-2 text-sm font-semibold uppercase tracking-wide text-base-bg hover:bg-team-bright disabled:opacity-50"
        >
          Create war
        </button>
      </div>
    </form>
  );
}

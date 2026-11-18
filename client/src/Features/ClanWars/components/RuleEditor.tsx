import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { RULE_TYPES, RULE_TYPE_LIST } from "../rules/definitions";
import { OUTLINE } from "./outline";
import type { ParamDef, Rule, RuleParams, RuleTypeId, Severity } from "../rules/types";

interface Props {
  /** null/undefined = creating a new rule. */
  initial?: Rule | null;
  onSave: (rule: Rule) => void;
  onClose: () => void;
}

type TypeChoice = RuleTypeId | "manual";

const inputClass =
  "w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 [color-scheme:dark] focus:border-gold/50 focus:outline-none";
const labelClass = "mb-1.5 block text-[10px] font-bold tracking-[0.14em] text-white/60";

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Turns whatever is in the inputs into valid, in-range values. */
function cleanParams(defs: ParamDef[], params: RuleParams, defaults: RuleParams): RuleParams {
  const out: RuleParams = {};
  for (const d of defs) {
    if (d.kind === "number") {
      const raw = params[d.key];
      const n = raw === "" || raw === undefined ? Number(defaults[d.key]) : Number(raw);
      out[d.key] = Math.min(d.max, Math.max(d.min, Math.round(Number.isFinite(n) ? n : d.min)));
    } else {
      out[d.key] = String(params[d.key] ?? d.options[0]?.value ?? "");
    }
  }
  return out;
}

export default function RuleEditor({ initial, onSave, onClose }: Props) {
  const editing = Boolean(initial);
  const [type, setType] = useState<TypeChoice>(initial?.type ?? "missedAttacks");
  const [params, setParams] = useState<RuleParams>(initial?.params ?? RULE_TYPES.missedAttacks.defaults);
  const [severity, setSeverity] = useState<Severity>(initial?.severity ?? "minor");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const def = type === "manual" ? null : RULE_TYPES[type];

  // The title follows the settings automatically until the leader types their own.
  const [titleOverride, setTitleOverride] = useState<string | null>(() => {
    if (!initial) return null;
    if (initial.type === "manual") return initial.title;
    const d = RULE_TYPES[initial.type];
    return d && initial.title !== d.describe(initial.params) ? initial.title : null;
  });
  const title = titleOverride ?? (def ? def.describe(params) : "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function chooseType(next: TypeChoice) {
    setType(next);
    setParams(next === "manual" ? {} : RULE_TYPES[next].defaults);
    setTitleOverride(null);
    setError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError(type === "manual" ? "Write the rule text." : "Give the rule a title.");
      return;
    }
    onSave({
      id: initial?.id ?? newId(),
      type,
      title: trimmed,
      params: def ? cleanParams(def.params, params, def.defaults) : {},
      severity,
      enabled: initial?.enabled ?? true,
      ...(type === "manual" && note.trim() ? { note: note.trim() } : {}),
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Edit rule" : "Add rule"}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border-2 border-line bg-black/70 p-6 shadow-2xl backdrop-blur-sm"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">{editing ? "EDIT RULE" : "NEW RULE"}</div>
            <h2 className="mt-1 font-display text-[26px] font-bold text-white" style={OUTLINE}>
              {editing ? "Edit rule" : "Add a rule"}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {!editing && (
          <div className="mt-5">
            <span className={labelClass}>RULE TYPE</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {RULE_TYPE_LIST.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => chooseType(t.id)}
                  className={`rounded-lg border p-3 text-left transition ${
                    type === t.id ? "border-gold/60 bg-gold/10" : "border-line bg-black/40 hover:border-gold/30"
                  }`}
                >
                  <div className={`text-sm font-semibold ${type === t.id ? "text-gold" : "text-white"}`}>{t.label}</div>
                  <div className="mt-1 text-[11px] leading-snug text-white/60">{t.blurb}</div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => chooseType("manual")}
                className={`rounded-lg border p-3 text-left transition ${
                  type === "manual" ? "border-gold/60 bg-gold/10" : "border-line bg-black/40 hover:border-gold/30"
                }`}
              >
                <div className={`text-sm font-semibold ${type === "manual" ? "text-gold" : "text-white"}`}>Manual rule</div>
                <div className="mt-1 text-[11px] leading-snug text-white/60">Free text. Shown to everyone but not auto-checked.</div>
              </button>
            </div>
          </div>
        )}

        {def && def.params.length > 0 && (
          <div className="mt-5 space-y-4">
            {def.params.map((p) => (
              <label key={p.key} className="block">
                <span className={labelClass}>{p.label.toUpperCase()}</span>
                {p.kind === "number" ? (
                  <input
                    type="number"
                    min={p.min}
                    max={p.max}
                    value={params[p.key] ?? ""}
                    onChange={(e) => setParams((prev) => ({ ...prev, [p.key]: e.target.value === "" ? "" : Number(e.target.value) }))}
                    className={`${inputClass} w-28`}
                  />
                ) : (
                  <select
                    value={String(params[p.key] ?? "")}
                    onChange={(e) => setParams((prev) => ({ ...prev, [p.key]: e.target.value }))}
                    className={inputClass}
                  >
                    {p.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
                {p.help && <span className="mt-1 block text-[11px] text-white/60">{p.help}</span>}
              </label>
            ))}
          </div>
        )}

        <label className="mt-5 block">
          <span className={labelClass}>{type === "manual" ? "RULE TEXT" : "TITLE"}</span>
          <input
            value={title}
            onChange={(e) => setTitleOverride(e.target.value)}
            placeholder={type === "manual" ? "e.g. Be active in clan chat" : undefined}
            className={inputClass}
            autoFocus={type === "manual"}
          />
        </label>

        {type === "manual" && (
          <label className="mt-4 block">
            <span className={labelClass}>DETAILS (OPTIONAL)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClass} />
          </label>
        )}

        <div className="mt-5">
          <span className={labelClass}>SEVERITY</span>
          <div className="flex gap-2">
            {(["minor", "major"] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSeverity(s)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold capitalize transition ${
                  severity === s
                    ? s === "major"
                      ? "border-red-500/50 bg-red-500/10 text-red-400"
                      : "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : "border-line text-white/70 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm text-white/70 hover:text-white">
            Cancel
          </button>
          <button
            type="submit"
            className="h-[42px] rounded-lg bg-gradient-to-b from-gold-soft to-gold px-5 text-sm font-bold text-[#1a1405] shadow-lg shadow-gold/10 transition hover:brightness-110"
          >
            {editing ? "Save changes" : "Add rule"}
          </button>
        </div>
      </form>
    </div>
  );
}
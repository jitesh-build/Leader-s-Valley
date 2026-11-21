import { RotateCcw } from "lucide-react";
import type { RoleCriteria } from "../types";

interface Field {
  key: keyof RoleCriteria;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
}

const PROMOTION: Field[] = [
  { key: "minParticipation", label: "War participation at least", unit: "%", min: 0, max: 100 },
  { key: "minAttackUse", label: "Attacks used (current war) at least", unit: "%", min: 0, max: 100 },
  { key: "minRaidUse", label: "Raid attacks used at least", unit: "%", min: 0, max: 100 },
  { key: "maxBreaks", label: "Rule breaks (current war) at most", min: 0, max: 20 },
  { key: "minDonations", label: "Donated at least", min: 0, max: 20000, step: 50 },
  { key: "minRatio", label: "Donation ratio at least", min: 0, max: 10, step: 0.1 },
  { key: "minClanGames", label: "Clan games points at least", min: 0, max: 4000, step: 100 },
  { key: "minTenureElder", label: "Days in clan for Elder", unit: "days", min: 0, max: 1000 },
  { key: "minTenureCo", label: "Days in clan for Co-leader", unit: "days", min: 0, max: 1000 },
];

const REVIEW: Field[] = [
  { key: "reviewBreaks", label: "Flag at this many rule breaks (current war)", min: 1, max: 30 },
  { key: "reviewAttackUse", label: "Flag below attacks used (current war)", unit: "%", min: 0, max: 100 },
  { key: "reviewDonations", label: "Flag below donations this season of", min: 0, max: 20000, step: 50 },
  { key: "reviewParticipation", label: "Flag below war participation of", unit: "%", min: 0, max: 100 },
];

interface Props {
  criteria: RoleCriteria;
  onChange: (key: keyof RoleCriteria, value: number) => void;
  onReset: () => void;
}

function FieldRow({ f, value, onChange }: { f: Field; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg bg-panel px-3 py-2 text-xs">
      <span className="text-muted2">{f.label}</span>
      <span className="flex shrink-0 items-center gap-1.5">
        <input
          type="number"
          min={f.min}
          max={f.max}
          step={f.step ?? 1}
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="h-8 w-20 rounded-lg border border-line bg-card px-2 text-right text-sm text-white focus:border-gold/50 focus:outline-none"
        />
        <span className="w-8 text-muted">{f.unit ?? ""}</span>
      </span>
    </label>
  );
}

/** The thresholds behind the suggestions. Saved in this browser. */
export default function CriteriaPanel({ criteria, onChange, onReset }: Props) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted">
          War participation, clan games and time in clan need history the game doesn't keep, so they're skipped for now. Your settings are ready for when they work.
        </p>
        <button type="button" onClick={onReset} className="flex shrink-0 items-center gap-1.5 text-xs text-muted hover:text-white">
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="mt-5 text-[10px] font-semibold tracking-[0.14em] text-muted">TO BE PROMOTED — ALL CHECKS WITH DATA MUST PASS</div>
      <div className="mt-2.5 space-y-1.5">
        {PROMOTION.map((f) => (
          <FieldRow key={f.key} f={f} value={criteria[f.key]} onChange={(v) => onChange(f.key, v)} />
        ))}
      </div>

      <div className="mt-6 text-[10px] font-semibold tracking-[0.14em] text-muted">REVIEW AN ELDER / CO-LEADER — ANY ONE TRIGGERS</div>
      <div className="mt-2.5 space-y-1.5">
        {REVIEW.map((f) => (
          <FieldRow key={f.key} f={f} value={criteria[f.key]} onChange={(v) => onChange(f.key, v)} />
        ))}
      </div>
    </div>
  );
}
import { useState, type FormEvent } from "react";
import { parseClanTag } from "../../../lib/clashApi";
import { OUTLINE, SOFT } from "./outline";

interface Props {
  /** Tag to start with (when changing clan). */
  initial?: string;
  onSave: (tag: string) => void;
  /** Shown only when there is a clan to go back to. */
  onCancel?: (() => void) | undefined;
  /** Shows the sample war instead of real data. */
  onDemo?: (() => void) | undefined;
}

const inputClass =
  "w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 [color-scheme:dark] focus:border-gold/50 focus:outline-none";

/** Asks for the clan tag, checks that it looks right, and hands the clean "#TAG" to the page. */
export default function ClanTagForm({ initial = "", onSave, onCancel, onDemo }: Props) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const tag = parseClanTag(value);
    if (!tag) {
      setError("That doesn't look like a clan tag. It's 3–15 letters and numbers, e.g. #2PP0JCCL.");
      return;
    }
    setError(null);
    onSave(tag);
  }

  return (
    <div className="flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-[520px] max-w-full rounded-xl border-2 border-line bg-black/65 p-6 shadow-2xl backdrop-blur-sm"
      >
        <div className="text-[11px] font-semibold tracking-[0.14em] text-gold-dim">LIVE DATA</div>
        <h2 className="mb-2 mt-1 font-display text-[26px] font-bold text-white" style={OUTLINE}>
          {onCancel ? "Change clan" : "Connect your clan"}
        </h2>
        <p className="mb-5 text-sm text-white/70" style={SOFT}>
          Enter your clan tag to load your current war. You can find it in the game under your clan's name.
        </p>

        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold tracking-[0.14em] text-white/60">CLAN TAG</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="#2PP0JCCL"
            autoFocus
            autoCapitalize="characters"
            spellCheck={false}
            className={inputClass}
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          {onDemo ? (
            <button type="button" onClick={onDemo} className="text-xs font-semibold text-white/60 underline-offset-2 hover:text-white hover:underline">
              Preview with sample data
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {onCancel && (
              <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2.5 text-sm text-white/70 hover:text-white">
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="h-[42px] rounded-lg bg-gradient-to-b from-gold-soft to-gold px-5 text-sm font-bold text-[#1a1405] shadow-lg shadow-gold/10 transition hover:brightness-110"
            >
              {onCancel ? "Save" : "Connect"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
import { useState } from "react";
import { useLayoutContext } from "../../Layout/useLayoutContext";
import { DEFAULT_SETTINGS, fillTemplate, useSettings } from "../settingsStore";
import { Field, SectionCard, ghostButton, inputClass, primaryButton } from "./ui";

const TOKENS: { token: string; hint: string }[] = [
  { token: "{players}", hint: "who still has attacks left" },
  { token: "{clan}", hint: "your clan's name" },
];

export default function RemindersSection() {
  const [settings, update] = useSettings();
  const { showToast } = useLayoutContext();
  const [draft, setDraft] = useState(settings.raidReminderTemplate);

  const preview = fillTemplate(draft, { players: "Pixel_Pete (2), Tinker (1), LittleBob (1)", clan: settings.clanName });
  const missingPlayers = !draft.includes("{players}");
  const dirty = draft !== settings.raidReminderTemplate;
  const valid = draft.trim().length > 0;

  return (
    <SectionCard
      id="reminders"
      eyebrow="MESSAGES"
      title="Raid weekend reminder"
      description="The message the “Copy reminder” button on the Capital Hall page puts on your clipboard, ready to paste into clan chat."
    >
      <Field label="MESSAGE TEMPLATE">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} className={inputClass} />
      </Field>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted">Insert:</span>
        {TOKENS.map((t) => (
          <button
            key={t.token}
            type="button"
            title={t.hint}
            onClick={() => setDraft((d) => `${d}${d && !d.endsWith(" ") ? " " : ""}${t.token}`)}
            className="rounded border border-line px-2 py-1 font-mono text-[11px] text-gold transition hover:bg-gold/10"
          >
            {t.token}
          </button>
        ))}
      </div>
      {missingPlayers && <p className="mt-2 text-[11px] text-amber-400">Add {"{players}"} so the message names the members who still have attacks left.</p>}

      <div className="mt-4 rounded-xl bg-panel p-4">
        <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">PREVIEW</div>
        <p className="mt-2 text-sm text-muted2">{preview || "—"}</p>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={() => setDraft(DEFAULT_SETTINGS.raidReminderTemplate)} className={ghostButton}>
          Use default
        </button>
        <button
          type="button"
          disabled={!dirty || !valid}
          onClick={() => {
            update({ raidReminderTemplate: draft });
            showToast("Reminder message saved");
          }}
          className={primaryButton}
        >
          Save message
        </button>
      </div>
    </SectionCard>
  );
}
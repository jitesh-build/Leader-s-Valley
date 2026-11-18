import { useState, type ChangeEvent } from "react";
import ClanBadge from "../../Home/components/Clanbadge";
import { useLayoutContext } from "../../Layout/useLayoutContext";
import { isValidTag, normalizeTag } from "../clanTag";
import { badgeInitials, useSettings, type ClanSettings } from "../settingsStore";
import { Field, SectionCard, ghostButton, inputClass, primaryButton } from "./ui";

interface Draft {
  clanName: string;
  clanTag: string;
  clanLevel: string;
  leaderName: string;
  badgeInitials: string;
  description: string;
}

const toDraft = (s: ClanSettings): Draft => ({
  clanName: s.clanName,
  clanTag: s.clanTag,
  clanLevel: String(s.clanLevel),
  leaderName: s.leaderName,
  badgeInitials: s.badgeInitials,
  description: s.description,
});

export default function ProfileSection() {
  const [settings, update] = useSettings();
  const { showToast } = useLayoutContext();
  const [draft, setDraft] = useState<Draft>(() => toDraft(settings));

  const set = (key: keyof Draft) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const tag = normalizeTag(draft.clanTag);
  const level = Number(draft.clanLevel);
  const errors = {
    clanName: !draft.clanName.trim() ? "Give your clan a name." : draft.clanName.trim().length > 15 ? "Clan names are at most 15 characters." : null,
    clanTag: isValidTag(tag) ? null : "Tags start with # and only use 0 2 8 9 P Y L Q G R J C U V.",
    clanLevel: Number.isInteger(level) && level >= 1 && level <= 99 ? null : "Enter a whole number from 1 to 99.",
    leaderName: draft.leaderName.trim() ? null : "Enter the name the app should call you.",
    description: draft.description.length > 256 ? "Descriptions are at most 256 characters." : null,
  };
  const valid = Object.values(errors).every((e) => e === null);

  const next: Partial<ClanSettings> = {
    clanName: draft.clanName.trim(),
    clanTag: tag,
    clanLevel: level,
    leaderName: draft.leaderName.trim(),
    badgeInitials: draft.badgeInitials.trim().toUpperCase().slice(0, 3),
    description: draft.description.trim(),
  };
  const dirty = (Object.keys(next) as (keyof ClanSettings)[]).some((k) => next[k] !== settings[k]);

  function save() {
    if (!valid) return;
    update(next);
    setDraft(toDraft({ ...settings, ...next }));
    showToast("Clan profile saved");
  }

  const previewInitials = badgeInitials({ badgeInitials: draft.badgeInitials, clanName: draft.clanName || "?" });

  return (
    <SectionCard
      id="profile"
      eyebrow="IDENTITY"
      title="Clan profile"
      description="Shown in the sidebar and on the home page. Once the Clash of Clans API is connected, the name, tag and level will fill in automatically."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CLAN NAME" error={errors.clanName}>
            <input value={draft.clanName} onChange={set("clanName")} maxLength={30} className={inputClass} />
          </Field>
          {/* <Field label="CLAN TAG" error={errors.clanTag} hint={tag && tag !== draft.clanTag.trim() ? `Will be saved as ${tag}` : undefined}>
            <input value={draft.clanTag} onChange={set("clanTag")} placeholder="#2L8Y9J" className={inputClass} />
          </Field> */}
          <Field
            label="CLAN TAG"
            error={errors.clanTag}
            {...(tag && tag !== draft.clanTag.trim() ? { hint: `Will be saved as ${tag}` } : {})}
          >
            <input value={draft.clanTag} onChange={set("clanTag")} placeholder="#2L8Y9J" className={inputClass} />
          </Field>
          <Field label="CLAN LEVEL" error={errors.clanLevel}>
            <input type="number" min={1} max={99} value={draft.clanLevel} onChange={set("clanLevel")} className={`${inputClass} w-28`} />
          </Field>
          <Field label="BADGE LETTERS" hint="Up to 3 letters. Leave empty to use the clan name's initials.">
            <input value={draft.badgeInitials} onChange={set("badgeInitials")} maxLength={3} className={`${inputClass} w-28 uppercase`} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="YOUR DISPLAY NAME" error={errors.leaderName} hint="Used in “Welcome back, …” and the sidebar.">
              <input value={draft.leaderName} onChange={set("leaderName")} maxLength={24} className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="DESCRIPTION" error={errors.description} hint={`${draft.description.length}/256`}>
              <textarea value={draft.description} onChange={set("description")} rows={3} className={inputClass} />
            </Field>
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted">PREVIEW</div>
          <div className="flex items-center gap-4 rounded-xl border border-line bg-panel px-5 py-4">
            <ClanBadge initials={previewInitials} size={38} fill="rgba(217,169,63,0.12)" stroke="#d9a93f" />
            <div className="min-w-0">
              <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">YOUR CLAN</div>
              <div className="truncate font-display text-xl font-bold leading-tight text-white">{draft.clanName || "—"}</div>
              <div className="text-xs text-muted">
                Level {Number.isFinite(level) ? level : "—"} · {tag || "—"}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted">This is how the clan card in the sidebar will look.</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={() => setDraft(toDraft(settings))} disabled={!dirty} className={ghostButton}>
          Discard
        </button>
        <button type="button" onClick={save} disabled={!dirty || !valid} className={primaryButton}>
          Save changes
        </button>
      </div>
    </SectionCard>
  );
}
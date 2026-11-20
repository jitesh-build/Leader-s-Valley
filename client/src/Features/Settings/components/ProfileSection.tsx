import { useState, type FormEvent } from "react";
import { RefreshCw } from "lucide-react";
import ClanBadge from "../../Home/components/Clanbadge";
import { initialsOf } from "../../Home/data/buildHome";
import { useLayoutContext } from "../../Layout/useLayoutContext";
import { useClanData } from "../../../lib/ClanDataProvider";
import { parseClanTag } from "../../../lib/clashApi";
import { useClanRoster } from "../../../lib/useClanRoster";
import { useSettings } from "../settingsStore";
import { Chip, Field, SectionCard, ghostButton, inputClass, primaryButton } from "./ui";

export default function ProfileSection() {
  const [settings, update] = useSettings();
  const { showToast } = useLayoutContext();
  const { clanTag, setClanTag, overview, loading, refreshing, error, updatedAt, refresh } = useClanData();
  const roster = useClanRoster(clanTag);

  // ---- clan tag (connect / change)
  const [changing, setChanging] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const showTagForm = clanTag === null || changing;

  function submitTag(e: FormEvent) {
    e.preventDefault();
    const tag = parseClanTag(tagDraft);
    if (!tag) {
      setTagError("That doesn't look like a clan tag. It's 3–15 letters and numbers, e.g. #2PP0JCCL.");
      return;
    }
    setTagError(null);
    setClanTag(tag);
    setChanging(false);
    setTagDraft("");
    showToast(clanTag === null ? "Clan connected" : "Clan changed");
  }

  // ---- your display name + badge letters (the only things the game can't tell us)
  const [nameDraft, setNameDraft] = useState(settings.leaderName);
  const [badgeDraft, setBadgeDraft] = useState(settings.badgeInitials);
  const nameError = nameDraft.trim() ? null : "Enter the name the app should call you.";
  const nextName = nameDraft.trim();
  const nextBadge = badgeDraft.trim().toUpperCase().slice(0, 3);
  const dirty = nextName !== settings.leaderName || nextBadge !== settings.badgeInitials;

  function save() {
    if (nameError) return;
    update({ leaderName: nextName, badgeInitials: nextBadge });
    setNameDraft(nextName);
    setBadgeDraft(nextBadge);
    showToast("Profile saved");
  }

  const clan = overview?.clan ?? null;
  const previewInitials = nextBadge || (clan ? initialsOf(clan.name) : "?");
  const leaders = (roster.data?.members ?? []).filter((m) => m.role === "leader" || m.role === "coLeader").slice(0, 6);
  const updated = updatedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <SectionCard
      id="profile"
      eyebrow="IDENTITY"
      title="Clan profile"
      description="Your clan's name, level and tag come straight from Clash of Clans. Only the name the app calls you and the badge letters are set here."
    >
      {/* ---- the clan ---- */}
      <div className="rounded-xl border border-line bg-panel p-5">
        {showTagForm ? (
          <form onSubmit={submitTag}>
            <Field label="CLAN TAG" error={tagError} hint="Find it in the game under your clan's name, e.g. #2PP0JCCL.">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                placeholder="#2PP0JCCL"
                autoFocus={changing}
                autoCapitalize="characters"
                spellCheck={false}
                className={`${inputClass} max-w-xs`}
              />
            </Field>
            <div className="mt-4 flex gap-2">
              <button type="submit" className={primaryButton}>
                {clanTag === null ? "Connect clan" : "Save clan"}
              </button>
              {changing && (
                <button type="button" onClick={() => { setChanging(false); setTagError(null); }} className={ghostButton}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-5">
            <ClanBadge initials={previewInitials} size={52} fill="rgba(217,169,63,0.12)" stroke="#d9a93f" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-display text-2xl font-bold leading-tight text-white">{clan?.name ?? (loading ? "Loading…" : "Clan unavailable")}</span>
                {clan ? <Chip tone="green">LIVE</Chip> : loading ? <Chip tone="amber">LOADING</Chip> : <Chip tone="red">ERROR</Chip>}
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {clan
                  ? `Level ${clan.level ?? "?"} · ${clan.tag} · ${clan.memberCount} members${clan.warLeague ? ` · ${clan.warLeague}` : ""}`
                  : (error?.message ?? clanTag)}
              </div>
              {clan?.description && <p className="mt-2 max-w-xl text-xs text-muted2">{clan.description}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={refresh}
                disabled={loading || refreshing}
                title={updated ? `Updated ${updated}` : "Refresh"}
                className={`${ghostButton} flex items-center gap-2`}
              >
                <RefreshCw size={14} className={loading || refreshing ? "animate-spin" : ""} />
                {updated ?? "Refresh"}
              </button>
              <button type="button" onClick={() => setChanging(true)} className={ghostButton}>
                Change clan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---- what's yours to set ---- */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="YOUR DISPLAY NAME" error={nameError} hint="Used in “Welcome back, …” and the sidebar.">
            <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={24} className={inputClass} />
          </Field>
          {leaders.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-muted">Your leadership team:</span>
              {leaders.map((m) => (
                <button
                  key={m.tag}
                  type="button"
                  onClick={() => setNameDraft(m.name.slice(0, 24))}
                  className="rounded border border-line px-2 py-1 text-[11px] text-gold transition hover:bg-gold/10"
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <Field label="BADGE LETTERS" hint="Up to 3 letters. Leave empty to use the clan name's initials.">
          <input value={badgeDraft} onChange={(e) => setBadgeDraft(e.target.value)} maxLength={3} className={`${inputClass} w-28 uppercase`} />
        </Field>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setNameDraft(settings.leaderName);
            setBadgeDraft(settings.badgeInitials);
          }}
          disabled={!dirty}
          className={ghostButton}
        >
          Discard
        </button>
        <button type="button" onClick={save} disabled={!dirty || nameError !== null} className={primaryButton}>
          Save changes
        </button>
      </div>
    </SectionCard>
  );
}
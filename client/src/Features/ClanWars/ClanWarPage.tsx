import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { RuleBreakersButton, RulesButton } from "./components/PanelButtons";
import RuleEditor from "./components/RuleEditor";
import RulesPanel from "./components/RulesPanel";
import Scoreboard from "./components/Scoreboard";
import ViolationsPanel from "./components/ViolationPanel";
import WarMap from "./components/WarMap";
import { useNow } from "./hooks/useNow";
import { useRules } from "./hooks/useRules";
import { useWarData } from "./hooks/useWarData";
import { evaluateRules } from "./rules/engine";
import type { Rule } from "./rules/types";

/**
 * Height the page has with a 15v15 war — the size the background was tuned on.
 * Smaller wars make a shorter page, so instead of re-scaling the picture to fit
 * we keep this scale and just hide the bottom of it. Taller pages stretch it
 * exactly like before. If the look drifts, open a 15v15 war in the browser dev
 * tools, read the page's height, and put that number here.
 */
const BG_REF_HEIGHT = 2400;

export default function ClanWarPage() {
  const { war, assignments, isSample } = useWarData();
  const { rules, saveRule, toggleRule, deleteRule } = useRules();
  // Re-check once a minute so "at risk" warnings kick in as the timer runs down.
  const now = useNow(60_000);

  // `null` = closed, `{ rule: null }` = adding, `{ rule }` = editing
  const [editor, setEditor] = useState<{ rule: Rule | null } | null>(null);
  const [showBreakers, setShowBreakers] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Which player's rule breaks to jump to inside the rule breakers panel.
  // `nonce` makes clicking the same player twice play the highlight again.
  const [focus, setFocus] = useState<{ tag: string; nonce: number } | null>(null);

  // Forget the target whenever the panel closes, so opening it later doesn't jump anywhere.
  useEffect(() => {
    if (!showBreakers) setFocus(null);
  }, [showBreakers]);

  function showRuleBreaksFor(tag: string) {
    setShowBreakers(true);
    setFocus({ tag, nonce: Date.now() });
  }

  // Esc closes the floating panels (the rule editor handles its own Esc).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || editor) return;
      setShowBreakers(false);
      setShowRules(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor]);

  const violations = useMemo(() => evaluateRules(war, rules, { now, assignments }), [war, rules, now, assignments]);

  const countByRule = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of violations) counts[v.ruleId] = (counts[v.ruleId] ?? 0) + 1;
    return counts;
  }, [violations]);

  const { violatedMembers, atRiskMembers } = useMemo(() => {
    const violated = new Set<string>();
    const risk = new Set<string>();
    for (const v of violations) (v.status === "violated" ? violated : risk).add(v.memberTag);
    for (const tag of violated) risk.delete(tag);
    return { violatedMembers: violated.size, atRiskMembers: risk.size };
  }, [violations]);

  const activeRuleCount = rules.filter((r) => r.enabled && r.type !== "manual").length;

  return (
    <div className="relative isolate min-h-full px-12 pb-10 pt-10">
      {/* Background. Not on the page itself because `overflow-hidden` on an ancestor would break the
          pinned buttons — this separate clip box only hides the bottom of the picture. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-full bg-[url('/cw_bg.png')] bg-cover bg-center bg-no-repeat"
          style={{ minHeight: BG_REF_HEIGHT }}
        />
      </div>

      {/* Clan rules button + overlay: pinned to the middle-right of the screen while you scroll */}
      <div className="pointer-events-none sticky top-1/2 z-30 h-0">
        <div className="absolute right-0 top-0 -translate-y-1/2">
          <RulesButton open={showRules} onClick={() => setShowRules((v) => !v)} />
        </div>
        {showRules && (
          <div className="pointer-events-auto absolute right-[84px] top-0 -translate-y-1/2">
            <RulesPanel
              rules={rules}
              countByRule={countByRule}
              onAdd={() => setEditor({ rule: null })}
              onEdit={(rule) => setEditor({ rule })}
              onToggle={toggleRule}
              onDelete={deleteRule}
              onClose={() => setShowRules(false)}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.16em] text-gold-dim">CLAN WAR</div>
          <h1 className="mt-5 font-display text-[40px] font-bold leading-none text-white">War room</h1>
          <p className="mt-3 text-sm text-muted">Track the battle and let the rules catch the rule breakers for you.</p>
        </div>
        {isSample && (
          <div className="mb-1 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-xs text-muted2">
            <Info size={14} className="text-gold" />
            Sample data — connect the Clash of Clans API to go live
          </div>
        )}
      </div>

      <div className="mt-9 space-y-5">
        <Scoreboard war={war} violatedMembers={violatedMembers} atRiskMembers={atRiskMembers} />
        <WarMap war={war} violations={violations} onShowRuleBreaks={showRuleBreaksFor} />
      </div>

      {/* Rule breakers button + overlay: pinned to the bottom-left of the screen while you scroll */}
      <div className="pointer-events-none sticky bottom-6 z-30 h-0">
        <div className="absolute bottom-0 left-0">
          <RuleBreakersButton
            open={showBreakers}
            onClick={() => setShowBreakers((v) => !v)}
            count={violatedMembers > 0 ? violatedMembers : atRiskMembers}
            tone={violatedMembers > 0 ? "red" : "amber"}
          />
        </div>
        {showBreakers && (
          <div className="pointer-events-auto absolute bottom-0 left-[92px]">
            <ViolationsPanel violations={violations} activeRuleCount={activeRuleCount} onClose={() => setShowBreakers(false)} focus={focus} />
          </div>
        )}
      </div>

      {editor && (
        <RuleEditor
          // key forces a fresh form every time it's opened for a different rule
          key={editor.rule?.id ?? "new"}
          initial={editor.rule}
          onSave={(rule) => {
            saveRule(rule);
            setEditor(null);
          }}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
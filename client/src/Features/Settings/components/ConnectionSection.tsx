import { useState } from "react";
import { CheckCircle2, CircleDashed, Loader2, MinusCircle, XCircle } from "lucide-react";
import { useClanData } from "../../../lib/ClanDataProvider";
import { ApiError, clashApi } from "../../../lib/clashApi";
import { Chip, SectionCard, ghostButton } from "./ui";

// Same base URL every page uses (VITE_API_URL in your hosting dashboard).
const BACKEND: string = import.meta.env.VITE_API_URL ?? "";

type CheckState = "idle" | "running" | "ok" | "error" | "skipped";
interface Check {
  id: "server" | "key" | "clan";
  label: string;
  state: CheckState;
  message: string;
}

const FRESH: Check[] = [
  { id: "server", label: "Your server", state: "idle", message: "Is the backend running and reachable from this site?" },
  { id: "key", label: "Clash of Clans key", state: "idle", message: "Does the server have its API key?" },
  { id: "clan", label: "Your clan", state: "idle", message: "Can the server look up your clan?" },
];

/** Which pages already read the real game, and which still show sample data. Update when a page is converted. */
const SOURCES: { name: string; detail: string; live: boolean }[] = [
  { name: "Overview & sidebar", detail: "Clan, war, capital hall, season and health", live: true },
  { name: "Clan wars", detail: "Current war and CWL round, refreshed every minute", live: true },
  { name: "Roles", detail: "Roster, donations, war and raid attacks", live: true },
  { name: "CWL base assigner", detail: "Your own server — REST API + live sockets", live: true },
  { name: "Members", detail: "Still shows a sample roster", live: false },
  { name: "Capital Hall", detail: "Still shows sample data", live: false },
];

const HELP: { when: string; fix: string }[] = [
  { when: "Your server fails", fix: "Check VITE_API_URL in your frontend hosting, and that the server's CLIENT_ORIGIN matches this site's address. A free server can take about a minute to wake up — try again." },
  { when: "Clash of Clans key fails", fix: "Add COC_API_TOKEN (and COC_API_BASE) in your server's Environment settings, then redeploy." },
  { when: "Your clan fails", fix: "Check the tag with “Change clan”. If the message mentions the key or IP, the key must allow the proxy's IP address 45.79.218.79. A private war log only blocks war data, not the clan lookup." },
];

async function checkServer(): Promise<{ ok: boolean; message: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${BACKEND}/api/health`, { signal: ctrl.signal });
    return res.ok ? { ok: true, message: "Server reachable" } : { ok: false, message: `The server answered with HTTP ${res.status}` };
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "AbortError";
    return {
      ok: false,
      message: timedOut ? "No answer after 8 seconds (a free server may still be waking up)" : "Couldn't reach the server — is it running, and does it allow this site (CORS)?",
    };
  } finally {
    clearTimeout(timer);
  }
}

const stateIcon = (s: CheckState) =>
  s === "ok" ? <CheckCircle2 size={16} className="text-green-400" /> :
  s === "error" ? <XCircle size={16} className="text-red-400" /> :
  s === "running" ? <Loader2 size={16} className="animate-spin text-muted2" /> :
  s === "skipped" ? <MinusCircle size={16} className="text-muted" /> :
  <CircleDashed size={16} className="text-muted" />;

export default function ConnectionSection() {
  const { clanTag, overview, updatedAt } = useClanData();
  const [checks, setChecks] = useState<Check[]>(FRESH);
  const [running, setRunning] = useState(false);
  const [ranAt, setRanAt] = useState<string | null>(null);

  async function runChecks() {
    setRunning(true);
    const set = (id: Check["id"], state: CheckState, message: string) =>
      setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, state, message } : c)));
    setChecks(FRESH.map((c) => ({ ...c, state: "running" as const })));

    // 1) server
    const server = await checkServer();
    set("server", server.ok ? "ok" : "error", server.message);
    if (!server.ok) {
      set("key", "skipped", "Needs a reachable server first.");
      set("clan", "skipped", "Needs a reachable server first.");
    } else {
      // 2) key
      let keyOk = false;
      try {
        const status = await clashApi.getStatus();
        keyOk = status.configured;
        set("key", keyOk ? "ok" : "error", keyOk ? "The server has its Clash of Clans key." : "The server has no COC_API_TOKEN set.");
      } catch (err) {
        set("key", "error", err instanceof ApiError ? err.message : "Couldn't ask the server about its key.");
      }
      // 3) clan
      if (!keyOk) set("clan", "skipped", "Needs the key first.");
      else if (!clanTag) set("clan", "skipped", "No clan connected yet — connect one in “Clan profile”.");
      else {
        try {
          const clan = await clashApi.getClan(clanTag);
          set("clan", "ok", `Found ${clan.name} (${clan.memberCount} members).`);
        } catch (err) {
          set("clan", "error", err instanceof ApiError ? err.message : "The lookup failed.");
        }
      }
    }
    setRanAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setRunning(false);
  }

  const lastLoad = updatedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <SectionCard
      id="connection"
      eyebrow="DATA"
      title="Clash of Clans connection"
      description="Live pages read the game through your own server, which keeps the API key secret. Run the check to see which link in the chain is broken, if any."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">DATA SOURCES</div>
          <ul className="mt-3 space-y-2">
            {SOURCES.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-3 rounded-lg bg-panel px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">{s.name}</div>
                  <div className="text-[11px] text-muted">{s.detail}</div>
                </div>
                <Chip tone={s.live ? "green" : "amber"}>{s.live ? "LIVE" : "SAMPLE"}</Chip>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">YOUR BACKEND</div>
          <dl className="mt-3 space-y-2 rounded-lg bg-panel px-4 py-3 text-xs">
            {/* <div className="flex justify-between gap-3">
              <dt className="text-muted">Server address</dt>
              <dd className="truncate text-white">{BACKEND || "this site (/api)"}</dd>
            </div> */}
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Tracked clan</dt>
              <dd className="truncate text-white">{overview ? `${overview.clan.name} · ${overview.clan.tag}` : (clanTag ?? "not connected")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Last live update</dt>
              <dd className="text-white">{lastLoad ?? "—"}</dd>
            </div>
          </dl>
          {/* <p className="mt-2 text-[11px] text-muted">
            The server address comes from the <code className="text-muted2">VITE_API_URL</code> setting in your hosting dashboard, so it can't be edited here.
          </p> */}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void runChecks()} disabled={running} className={ghostButton}>
              {running ? "Checking…" : "Test connection"}
            </button>
            {ranAt && !running && <span className="text-[11px] text-muted">Checked at {ranAt}</span>}
          </div>

          <ul className="mt-3 space-y-2" aria-live="polite">
            {checks.map((c) => (
              <li key={c.id} className="flex items-start gap-3 rounded-lg bg-panel px-4 py-3">
                <span className="mt-0.5 shrink-0">{stateIcon(c.state)}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">{c.label}</div>
                  <div className={`text-[11px] ${c.state === "error" ? "text-red-400" : "text-muted"}`}>{c.message}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-panel p-4">
        <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">IF A CHECK FAILS</div>
        <ul className="mt-3 space-y-2 text-xs text-muted2">
          {HELP.map((h) => (
            <li key={h.when}>
              <span className="font-semibold text-white">{h.when}:</span> {h.fix}
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}
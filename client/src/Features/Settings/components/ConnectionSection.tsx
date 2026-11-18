import { useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useSettings } from "../settingsStore";
import { Chip, SectionCard, ghostButton } from "./ui";

// Same base URL the CWL page already uses (see CWL/api/client.ts).
const BACKEND: string = import.meta.env.VITE_API_URL ?? "";

type Probe =
  | { state: "idle" }
  | { state: "testing" }
  | { state: "ok" | "error"; message: string; at: string };

async function probeBackend(): Promise<Probe> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  const at = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  try {
    const res = await fetch(`${BACKEND}/api/wars`, { signal: ctrl.signal });
    return res.ok
      ? { state: "ok", message: `Server reachable (HTTP ${res.status})`, at }
      : { state: "error", message: `The server answered with HTTP ${res.status}`, at };
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "AbortError";
    return {
      state: "error",
      message: timedOut ? "No answer after 6 seconds" : "Couldn't reach the server — is it running, and does it allow requests from this site (CORS)?",
      at,
    };
  } finally {
    clearTimeout(timer);
  }
}

const SOURCES: { name: string; detail: string; live: boolean }[] = [
  { name: "CWL base assigner", detail: "Your own server — REST API + live sockets", live: true },
  { name: "Clan wars", detail: "useWarData() returns a sample war", live: false },
  { name: "Members & Roles", detail: "useMembers() returns a sample roster", live: false },
  { name: "Capital Hall", detail: "useCapitalData() is built from the sample roster", live: false },
];

export default function ConnectionSection() {
  const [settings] = useSettings();
  const [probe, setProbe] = useState<Probe>({ state: "idle" });

  async function test() {
    setProbe({ state: "testing" });
    setProbe(await probeBackend());
  }

  return (
    <SectionCard
      id="connection"
      eyebrow="DATA"
      title="Clash of Clans connection"
      description="Right now only the CWL assigner talks to a real server. The other pages show sample data until the Clash of Clans API is connected through your backend."
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
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Server address</dt>
              <dd className="truncate text-white">{BACKEND || "this site (/api)"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Tracked clan</dt>
              <dd className="text-white">{settings.clanTag}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] text-muted">
            The server address comes from the <code className="text-muted2">VITE_API_URL</code> setting in your hosting dashboard, so it can't be edited here.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void test()} disabled={probe.state === "testing"} className={ghostButton}>
              {probe.state === "testing" ? "Testing…" : "Test connection"}
            </button>
            {probe.state === "testing" && <Loader2 size={16} className="animate-spin text-muted" />}
            {(probe.state === "ok" || probe.state === "error") && (
              <span className={`flex items-center gap-2 text-xs ${probe.state === "ok" ? "text-green-400" : "text-red-400"}`}>
                {probe.state === "ok" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                {probe.message} · {probe.at}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-panel p-4">
        <div className="text-[10px] font-semibold tracking-[0.14em] text-muted">GOING LIVE</div>
        <ol className="mt-3 space-y-2 text-xs text-muted2">
          <li>
            <span className="font-semibold text-white">1.</span> Create an API key at developer.clashofclans.com and allow your server's IP address — the key only works from that address.
          </li>
          <li>
            <span className="font-semibold text-white">2.</span> Keep the key on your server as an environment variable. Never put it in this website's code — anyone could read it.
          </li>
          <li>
            <span className="font-semibold text-white">3.</span> Have your server fetch clan, war and raid data and expose it to this app, then return it from the sample-data hooks listed above.
          </li>
        </ol>
      </div>
    </SectionCard>
  );
}
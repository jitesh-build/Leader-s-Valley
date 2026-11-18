import { Bell, Database, Hourglass, Plug, Shield, type LucideIcon } from "lucide-react";
import ComingSoonSection from "./components/ComingSoonSection";
import ConnectionSection from "./components/ConnectionSection";
import DataSection from "./components/DataSection";
import ProfileSection from "./components/ProfileSection";
import RemindersSection from "./components/RemindersSection";

const SECTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Clan profile", icon: Shield },
  { id: "connection", label: "Connection", icon: Plug },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "data", label: "Your data", icon: Database },
  { id: "soon", label: "Coming soon", icon: Hourglass },
];

export default function SettingsPage() {
  return (
    <div className="px-12 pb-10 pt-10">
      <div className="text-[11px] font-semibold tracking-[0.16em] text-gold-dim">CONFIGURATION</div>
      <h1 className="mt-5 font-display text-[40px] font-bold leading-none text-white">Clan settings</h1>
      <p className="mt-3 text-sm text-muted">Your clan's identity, data connection and saved preferences.</p>

      <div className="mt-9 grid gap-8 xl:grid-cols-[190px_1fr]">
        <nav aria-label="Settings sections" className="hidden self-start xl:sticky xl:top-6 xl:block">
          <ul className="space-y-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted2 transition hover:bg-white/5 hover:text-white"
                >
                  <Icon size={16} strokeWidth={1.6} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-5">
          <ProfileSection />
          <ConnectionSection />
          <RemindersSection />
          <DataSection />
          <ComingSoonSection />
        </div>
      </div>
    </div>
  );
}
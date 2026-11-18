import { BellRing, Building2, Users } from "lucide-react";
import { Chip, SectionCard } from "./ui";

const ITEMS = [
  { icon: Users, title: "Sign-in & permissions", text: "Choose which roles can edit rules, assign CWL bases, manage roles and see leader notes." },
  { icon: BellRing, title: "Notifications", text: "Send war and raid reminders to Discord or WhatsApp automatically, and get alerted when someone breaks a rule." },
  { icon: Building2, title: "Multiple clans", text: "Run a main clan and its feeder clans from one account, switching from the clan card in the sidebar." },
];

export default function ComingSoonSection() {
  return (
    <SectionCard id="soon" eyebrow="ON THE ROADMAP" title="Coming soon" description="These need a backend with sign-in first, so they're not available yet.">
      <ul className="grid gap-3 md:grid-cols-3">
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-xl border border-dashed border-line bg-panel p-4">
            <div className="flex items-center justify-between">
              <Icon size={20} strokeWidth={1.6} className="text-muted2" />
              <Chip tone="muted">SOON</Chip>
            </div>
            <div className="mt-3 text-sm font-semibold text-white">{title}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
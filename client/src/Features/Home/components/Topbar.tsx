import { Bell, Search } from "lucide-react";

interface Props {
  onAddMember: () => void;
}

export default function TopBar({ onAddMember }: Props) {
  return (
    <header className="flex h-[86px] items-center justify-between border-b border-line px-12">
      <label className="flex h-[42px] w-[388px] items-center gap-3 rounded-lg border border-line bg-card px-4 text-muted focus-within:border-gold/50">
        <Search size={16} />
        <input
          placeholder="Search members, events..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
        />
        <kbd className="rounded border border-line px-1.5 py-0.5 text-[11px]">⌘ K</kbd>
      </label>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-sm text-muted2">
          <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]" />
          Live sync
        </div>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-card text-muted2 hover:text-white">
          <Bell size={18} />
          <span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
        <button
          onClick={onAddMember}
          className="h-[42px] rounded-lg bg-gradient-to-b from-gold-soft to-gold px-5 text-sm font-bold text-[#1a1405] shadow-lg shadow-gold/10 transition hover:brightness-110"
        >
          + Add member
        </button>
      </div>
    </header>
  );
}
import { Check } from "lucide-react";

export default function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-line bg-[#1f1d17] px-5 py-4 text-sm text-white shadow-2xl">
      <Check size={16} className="text-gold" />
      {message}
    </div>
  );
}
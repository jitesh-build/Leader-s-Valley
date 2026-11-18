import type { ReactNode } from "react";
import { X } from "lucide-react";
import { OUTLINE } from "./outline";

interface Props {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  /** Extra control shown next to the close button (e.g. "Add rule"). */
  action?: ReactNode;
  children: ReactNode;
}

/** Dark, translucent, outlined overlay — same look as the scoreboard. */
export default function FloatingPanel({ title, eyebrow, onClose, action, children }: Props) {
  return (
    <section
      role="dialog"
      aria-label={title}
      className="flex max-h-[70vh] w-[min(400px,calc(100vw-3rem))] flex-col rounded-xl border-2 border-line bg-black/55 shadow-2xl backdrop-blur-sm"
    >
      <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
        <div className="min-w-0">
          {eyebrow && <div className="text-[10px] font-bold tracking-[0.14em] text-gold-dim">{eyebrow}</div>}
          <h2 className="font-display text-2xl font-bold leading-tight text-white" style={OUTLINE}>
            {title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="rounded-md p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </header>
      <div data-panel-body className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {children}
      </div>
    </section>
  );
}
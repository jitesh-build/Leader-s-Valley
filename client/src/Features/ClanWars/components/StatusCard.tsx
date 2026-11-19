import type { ReactNode } from "react";
import { AlertTriangle, Info, Loader2 } from "lucide-react";
import { OUTLINE, SOFT } from "./outline";

interface Props {
  tone: "info" | "error" | "loading";
  title: string;
  children?: ReactNode;
  /** Buttons shown under the text. */
  action?: ReactNode;
}

/** Dark translucent card for "loading", "no war right now" and error messages (same look as the scoreboard). */
export default function StatusCard({ tone, title, children, action }: Props) {
  const icon =
    tone === "loading" ? (
      <Loader2 size={26} className="animate-spin text-gold" />
    ) : tone === "error" ? (
      <AlertTriangle size={26} className="text-red-400" />
    ) : (
      <Info size={26} className="text-gold" />
    );

  return (
    <div className="flex justify-center">
      <section
        role={tone === "error" ? "alert" : "status"}
        className={`flex w-[560px] max-w-full items-start gap-4 rounded-xl border-2 bg-black/55 p-5 shadow-2xl backdrop-blur-sm ${
          tone === "error" ? "border-red-900/70" : "border-line"
        }`}
      >
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold leading-tight text-white" style={OUTLINE}>
            {title}
          </h2>
          {children && (
            <div className="mt-1.5 text-sm text-white/75" style={SOFT}>
              {children}
            </div>
          )}
          {action && <div className="mt-4 flex flex-wrap items-center gap-2">{action}</div>}
        </div>
      </section>
    </div>
  );
}
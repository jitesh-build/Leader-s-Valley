const pad = (n: number): string => String(n).padStart(2, "0");

/** 9.5 -> "9h 30m", 0.5 -> "30m" */
export function formatHours(hours: number): string {
  const total = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatCountdown(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(t / 3600))}h ${pad(Math.floor((t % 3600) / 60))}m ${pad(t % 60)}s`;
}

export function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return letters || "?";
}
interface Props {
  value: number;
  className?: string;
  fillClass?: string;
}

export default function ProgressBar({ value, className = "", fillClass = "bg-gold" }: Props) {
  return (
    <div className={`h-1 overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div className={`h-full rounded-full ${fillClass}`} style={{ width: `${value}%` }} />
    </div>
  );
}
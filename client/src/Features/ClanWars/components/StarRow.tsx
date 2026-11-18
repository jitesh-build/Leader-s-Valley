import { Star } from "lucide-react";

interface Props {
  count: number;
  max?: number;
  size?: number;
}

export default function StarRow({ count, max = 3, size = 12 }: Props) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${count} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} size={size} strokeWidth={1.6} className={i < count ? "fill-gold text-gold" : "text-white/20"} />
      ))}
    </span>
  );
}
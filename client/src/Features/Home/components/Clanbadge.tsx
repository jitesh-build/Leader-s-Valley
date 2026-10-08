interface Props {
  initials: string;
  size?: number;
  fill: string;
  stroke?: string;
  textClass?: string;
}

/** Shield-shaped clan emblem. */
export default function ClanBadge({ initials, size = 40, fill, stroke, textClass = "text-gold" }: Props) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size * 1.1 }}>
      <svg viewBox="0 0 40 44" className="h-full w-full">
        <path
          d="M20 1.5 37.5 8v16c0 9-7.5 15.5-17.5 18.5C10 39.5 2.5 33 2.5 24V8z"
          fill={fill}
          stroke={stroke}
          strokeWidth={stroke ? 2.5 : 0}
          strokeLinejoin="round"
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center pb-1 font-display text-[0.8em] font-bold ${textClass}`}
        style={{ fontSize: size * 0.34 }}>
        {initials}
      </span>
    </div>
  );
}
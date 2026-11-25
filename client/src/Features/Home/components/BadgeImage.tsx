import type { ReactNode } from "react";

export default function BadgeImage({ src, name, size = 46, fallback }: {
  src?: string | null;
  name: string | null;
  size?: number;
  fallback: ReactNode;
}) {
  if (!src) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt={`${name ?? "Clan"} badge`}
      loading="lazy"
      className="object-contain drop-shadow"
      style={{ width: size, height: size, maxWidth: "none" }}
    />
  );
}
import type { CSSProperties } from "react";

/** Same black text outline the scoreboard uses. */
export const OUTLINE: CSSProperties = {
  textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
};

/** Lighter shadow for small body text where a full outline would look heavy. */
export const SOFT: CSSProperties = { textShadow: "0 1px 2px #000, 0 0 3px rgba(0,0,0,0.8)" };
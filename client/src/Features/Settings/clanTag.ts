// Clash of Clans tags only use these characters (the letter O is read as zero).
const TAG_RE = /^#[0289PYLQGRJCUV]{3,12}$/;

/** "2l8y9j", "#2L8Y9J", "#2L8Y9J " -> "#2L8Y9J" */
export function normalizeTag(input: string): string {
  const t = input.trim().toUpperCase().replace(/O/g, "0").replace(/^#+/, "");
  return t ? `#${t}` : "";
}

export const isValidTag = (tag: string): boolean => TAG_RE.test(tag);
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET is not set (or is too short) — add a long random string to the environment");
  }
  return s;
}

const SESSION_DAYS = 30;
export const SESSION_MAX_AGE_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export function signSessionToken(userId: string): string {
  return jwt.sign({ sub: userId }, secret(), { expiresIn: `${SESSION_DAYS}d` });
}

/** Returns the user id the token was issued for, or null if it's missing, malformed, or expired. */
export function verifySessionToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, secret());
    if (typeof payload === "object" && payload !== null && typeof payload.sub === "string") return payload.sub;
    return null;
  } catch {
    return null;
  }
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/** The raw token goes in the emailed link; only its hash is ever stored, the same way a password is. */
export function createResetToken(): { token: string; hash: string; expires: Date } {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, hash: hashResetToken(token), expires: new Date(Date.now() + RESET_TOKEN_TTL_MS) };
}

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
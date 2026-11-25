import bcrypt from "bcryptjs";

const ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** The client checks this too, but never trust the client alone. */
export function isPasswordStrongEnough(plain: string): boolean {
  return typeof plain === "string" && plain.length >= 8 && plain.length <= 200;
}

import { Router } from "express";
import type { Response } from "express";
import { User } from "../models/User";
import { UserData } from "../models/UserData";
import { asyncHandler, HttpError } from "../asyncHandler";
import { hashPassword, isPasswordStrongEnough, verifyPassword } from "../auth/password";
import { createResetToken, hashResetToken, SESSION_MAX_AGE_MS, signSessionToken } from "../auth/tokens";
import { sendMail } from "../auth/mailer";
import { requireAuth, SESSION_COOKIE } from "../middleware/requireAuth";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: unknown): string {
  if (typeof raw !== "string") throw new HttpError(400, "Email is required");
  const email = raw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Enter a valid email address");
  return email;
}

/** "none" is required for a frontend and backend on different domains (and needs COOKIE_SECURE=true, i.e. https). */
function cookieOptions() {
  const secure = (process.env.COOKIE_SECURE ?? (process.env.NODE_ENV === "production" ? "true" : "false")) === "true";
  const sameSite = (process.env.COOKIE_SAMESITE as "lax" | "none" | "strict" | undefined) ?? (secure ? "none" : "lax");
  return { httpOnly: true, secure, sameSite, maxAge: SESSION_MAX_AGE_MS, path: "/" } as const;
}

function setSession(res: Response, userId: string): void {
  res.cookie(SESSION_COOKIE, signSessionToken(userId), cookieOptions());
}

function profile(u: { _id: unknown; email: string; leaderName: string }) {
  return { id: String(u._id), email: u.email, leaderName: u.leaderName };
}

// POST /api/auth/register
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email: rawEmail, password, leaderName } = req.body as { email?: unknown; password?: unknown; leaderName?: unknown };
    const email = normalizeEmail(rawEmail);
    if (typeof password !== "string" || !isPasswordStrongEnough(password)) {
      throw new HttpError(400, "Password must be at least 8 characters");
    }
    const name = typeof leaderName === "string" ? leaderName.trim().slice(0, 24) : "";
    if (!name) throw new HttpError(400, "Tell us what to call you");

    const existing = await User.findOne({ email }).lean();
    if (existing) throw new HttpError(409, "An account with this email already exists");

    const passwordHash = await hashPassword(password);
    const user = await User.create({ email, passwordHash, leaderName: name });

    setSession(res, String(user._id));
    res.status(201).json({ user: profile(user) });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email: rawEmail, password } = req.body as { email?: unknown; password?: unknown };
    const email = normalizeEmail(rawEmail);
    if (typeof password !== "string" || password.length === 0) throw new HttpError(400, "Password is required");

    const user = await User.findOne({ email });
    // Same message whether the email exists or the password is wrong — don't help an attacker narrow it down.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new HttpError(401, "Incorrect email or password");
    }

    setSession(res, String(user._id));
    res.json({ user: profile(user) });
  })
);

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.status(204).send();
});

// GET /api/auth/me
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).lean();
    if (!user) throw new HttpError(401, "Please log in");
    res.json({ user: profile(user) });
  })
);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const email = normalizeEmail((req.body as { email?: unknown }).email);
    const user = await User.findOne({ email });

    // Always answer the same way — the response must not reveal whether that email has an account.
    const generic = { message: "If an account exists for that email, a reset link is on its way." };
    if (!user) {
      res.json(generic);
      return;
    }

    const { token, hash, expires } = createResetToken();
    user.resetTokenHash = hash;
    user.resetTokenExpires = expires;
    await user.save();

    const base = (process.env.CLIENT_APP_URL ?? "http://localhost:5173").replace(/\/+$/, "");
    const resetUrl = `${base}/reset-password?token=${token}`;
    const { sent } = await sendMail(
      user.email,
      "Reset your Leader's Valley password",
      `Someone asked to reset the password for this account.\n\nIf that was you, open this link within an hour:\n${resetUrl}\n\nIf it wasn't you, you can ignore this email — your password hasn't changed.`
    );

    // No email service is configured yet outside production: hand the link back directly so resets can still be tested.
    if (!sent && process.env.NODE_ENV !== "production") {
      res.json({ ...generic, devResetUrl: resetUrl });
      return;
    }
    res.json(generic);
  })
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, password } = req.body as { token?: unknown; password?: unknown };
    if (typeof token !== "string" || token.length < 10) throw new HttpError(400, "That reset link is invalid or has expired");
    if (typeof password !== "string" || !isPasswordStrongEnough(password)) throw new HttpError(400, "Password must be at least 8 characters");

    const user = await User.findOne({ resetTokenHash: hashResetToken(token), resetTokenExpires: { $gt: new Date() } });
    if (!user) throw new HttpError(400, "That reset link is invalid or has expired — request a new one");

    user.passwordHash = await hashPassword(password);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();

    setSession(res, String(user._id));
    res.json({ user: profile(user) });
  })
);

// POST /api/auth/change-password
router.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as { currentPassword?: unknown; newPassword?: unknown };
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") throw new HttpError(400, "Both passwords are required");
    if (!isPasswordStrongEnough(newPassword)) throw new HttpError(400, "New password must be at least 8 characters");

    const user = await User.findById(req.userId);
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new HttpError(401, "Current password is incorrect");
    }
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    res.status(204).send();
  })
);

// DELETE /api/auth/account - removes the account and everything stored for it
router.delete(
  "/account",
  requireAuth,
  asyncHandler(async (req, res) => {
    await Promise.all([User.findByIdAndDelete(req.userId), UserData.deleteMany({ userId: req.userId })]);
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.status(204).send();
  })
);

export default router;

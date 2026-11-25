import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../asyncHandler";
import { verifySessionToken } from "../auth/tokens";

export const SESSION_COOKIE = "cf_session";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by requireAuth once the session cookie has been verified. */
      userId?: string;
    }
  }
}

/** Rejects the request with 401 unless it carries a valid session cookie. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  const userId = token ? verifySessionToken(token) : null;
  if (!userId) {
    next(new HttpError(401, "Please log in"));
    return;
  }
  req.userId = userId;
  next();
}

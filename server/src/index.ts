import path from "path";
import fs from "fs";
import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db";
import warsRouter from "./routes/wars";
import slotsRouter from "./routes/slots";
import enemyScoutsRouter from "./routes/enemyScouts";
import { HttpError } from "./asyncHandler";

// Only relevant for local dev — on Vercel, env vars come from the dashboard,
// not a .env file, so this quietly no-ops in production.
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const IS_VERCEL = process.env.VERCEL === "1";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    const envExists = fs.existsSync(envPath);
    throw new Error(
      `Missing required environment variable ${name}.\n` +
        (IS_VERCEL
          ? `Set it under Vercel → Project → Settings → Environment Variables.`
          : `Looked for it in: ${envPath} (file ${envExists ? "exists" : "was NOT found"}).\n` +
            `Create server/.env (copy server/.env.example) and set ${name} there — for Atlas this is your "mongodb+srv://..." connection string.`)
    );
  }
  return value;
}

const MONGODB_URI = requireEnv("MONGODB_URI");
const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

const dbReady = connectDB(MONGODB_URI);

app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await dbReady;
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api/wars", warsRouter);
app.use("/api", slotsRouter);
app.use("/api", enemyScoutsRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);


if (!IS_VERCEL) {
  app.listen(PORT);
}

export default app;
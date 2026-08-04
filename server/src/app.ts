import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import cors from "cors";
import { connectDB } from "./db";
import warsRouter from "./routes/wars";
import slotsRouter from "./routes/slots";
import enemyScoutsRouter from "./routes/enemyScouts";
import { HttpError } from "./asyncHandler";

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable ${name}. Set it in server/.env locally, or in your host's dashboard in production.`
    );
  }
  return value;
}

const MONGODB_URI = requireEnv("MONGODB_URI");

// Kick off the DB connection once at module load. On a serverless platform
// this module can stay warm across invocations, so every request reuses
// the same connection promise instead of reconnecting each time.
const dbReady = connectDB(MONGODB_URI);

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

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
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);

export default app;
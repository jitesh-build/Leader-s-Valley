// import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { connectDB } from "./db";
// import warsRouter from "./routes/wars";
// import slotsRouter from "./routes/slots";
// import enemyScoutsRouter from "./routes/enemyScouts";
// import { HttpError } from "./asyncHandler";

// dotenv.config();

// const PORT = Number(process.env.PORT ?? 4000);
// const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

// function requireEnv(name: string): string {
//   const value = process.env[name];
//   if (!value || value.trim().length === 0) {
//     throw new Error(
//       `Missing required environment variable ${name}. Set it in server/.env (see .env.example) — for Atlas this is your "mongodb+srv://..." connection string.`
//     );
//   }
//   return value;
// }

// const MONGODB_URI = requireEnv("MONGODB_URI");

// const app = express();

// app.use(cors({ origin: CLIENT_ORIGIN }));
// app.use(express.json());

// app.get("/api/health", (_req: Request, res: Response) => {
//   res.json({ status: "ok" });
// });

// app.use("/api/wars", warsRouter);
// app.use("/api", slotsRouter);
// app.use("/api", enemyScoutsRouter);

// app.use((_req: Request, res: Response) => {
//   res.status(404).json({ error: "Not found" });
// });

// const errorHandler: ErrorRequestHandler = (err, _req, res, _next: NextFunction) => {
//   if (err instanceof HttpError) {
//     res.status(err.status).json({ error: err.message });
//     return;
//   }
//   // eslint-disable-next-line no-console
//   console.error(err);
//   res.status(500).json({ error: "Internal server error" });
// };
// app.use(errorHandler);

// async function main(): Promise<void> {
//   await connectDB(MONGODB_URI);
//   app.listen(PORT, () => {
//     // eslint-disable-next-line no-console
//     console.log(`[server] listening on http://localhost:${PORT}`);
//   });
// }

// main().catch((err) => {
//   // eslint-disable-next-line no-console
//   console.error("[server] failed to start", err);
//   process.exit(1);
// });

import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db";
import warsRouter from "./routes/wars";
import slotsRouter from "./routes/slots";
import enemyScoutsRouter from "./routes/enemyScouts";
import { HttpError } from "./asyncHandler";

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable ${name}. Set it in server/.env locally (see .env.example), or in Render's Environment tab in production.`
    );
  }
  return value;
}

const MONGODB_URI = requireEnv("MONGODB_URI");

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

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

async function main(): Promise<void> {
  await connectDB(MONGODB_URI);
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[server] failed to start", err);
  process.exit(1);
});
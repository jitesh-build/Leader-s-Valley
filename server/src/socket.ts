import { Server as IOServer } from "socket.io";
import type { Server as HttpServer } from "http";

let io: IOServer | null = null;

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

/**
 * Room model:
 *  - `wars:list`   -> every connected client. Used to keep the war picker
 *                     (dropdown, create/delete) in sync across everyone.
 *  - `war:<warId>` -> clients actively viewing that war's CWL board. Used to
 *                     sync slot assignments and enemy-scout ratings live.
 *
 * Call initSocket() once, from the persistent-server entrypoint (index.ts),
 * right after creating the http.Server and before it starts listening.
 */
export function initSocket(httpServer: HttpServer): IOServer {
  io = new IOServer(httpServer, {
    cors: { origin: CLIENT_ORIGIN },
  });

  io.on("connection", (socket) => {
    socket.join("wars:list");

    socket.on("war:join", (warId: unknown) => {
      if (typeof warId === "string" && warId.length > 0) {
        socket.join(`war:${warId}`);
      }
    });

    socket.on("war:leave", (warId: unknown) => {
      if (typeof warId === "string" && warId.length > 0) {
        socket.leave(`war:${warId}`);
      }
    });
  });

  return io;
}

/**
 * Broadcasts to everyone currently viewing a given war's board.
 * No-ops if sockets were never initialized — e.g. when the app is served
 * through the serverless entrypoint (app.ts), which can't hold persistent
 * websocket connections. REST behavior is unaffected either way.
 */
export function emitToWar(warId: string, event: string, payload: unknown): void {
  io?.to(`war:${warId}`).emit(event, payload);
}

/** Broadcasts to everyone with the war picker mounted (war list changes). */
export function emitToWarsList(event: string, payload: unknown): void {
  io?.to("wars:list").emit(event, payload);
}
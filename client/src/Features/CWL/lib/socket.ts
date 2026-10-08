import { io, Socket } from "socket.io-client";

// Reuse the same VITE_API_URL used for REST calls. Locally that's unset, so
// we fall back straight to the backend's dev port (4000) — unlike plain
// fetch(), a websocket handshake isn't covered by Vite's "/api" dev proxy
// unless you separately configure `server.proxy["/socket.io"]` with
// `ws: true`, so pointing directly at the backend origin is simpler.
const SOCKET_URL: string = import.meta.env.VITE_API_URL || "http://localhost:4000";

// One connection for the whole app's lifetime — every hook/component that
// needs realtime updates imports this same instance rather than opening
// its own.
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});
// =============================================================================
// Emit Service — Socket.IO emission helpers
// =============================================================================

import { Server } from "socket.io";

let io: Server | null = null;

export function setIO(server: Server) {
  io = server;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO not initialized yet.");
  return io;
}

// Safe emit — fire and forget, never crashes the caller
export function safeEmit(room: string, event: string, payload: unknown): void {
  try {
    getIO().to(room).emit(event, payload);
  } catch (err) {
    console.error(`Socket emit to "${room}" (${event}) failed:`, err);
  }
}

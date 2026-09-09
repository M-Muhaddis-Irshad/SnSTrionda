// =============================================================================
// HTTP Emit Bridge — POST /emit
// =============================================================================
// The backend (Vercel) calls this endpoint to emit Socket.IO events to rooms.
// This replaces the old in-process getIO() calls that only worked when
// Socket.IO was co-located with the Express backend.
//
// POST /emit
// Body: { room: string, event: string, payload: any }
// Auth: Internal API key (EMIT_API_KEY env var) in Authorization header
// =============================================================================

import { Router, Request, Response } from "express";
import { safeEmit } from "../services/emitService";

const router = Router();

// Internal API key — backend sets EMIT_API_KEY in its env, socket server
// checks it here. This keeps the bridge private.
const EMIT_API_KEY = process.env.EMIT_API_KEY || "";

router.post("/", (req: Request, res: Response) => {
  // Verify internal API key
  const authHeader = req.headers.authorization;
  if (!EMIT_API_KEY || authHeader !== `Bearer ${EMIT_API_KEY}`) {
    return res.status(401).json({ error: "Invalid or missing EMIT_API_KEY." });
  }

  const { room, event, payload } = req.body;

  if (!room || !event) {
    return res.status(400).json({ error: "room and event are required." });
  }

  safeEmit(room, event, payload);

  res.json({ ok: true });
});

// Batch emit — emit to multiple rooms in one call
router.post("/batch", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!EMIT_API_KEY || authHeader !== `Bearer ${EMIT_API_KEY}`) {
    return res.status(401).json({ error: "Invalid or missing EMIT_API_KEY." });
  }

  const { emits } = req.body as {
    emits?: Array<{ room: string; event: string; payload: unknown }>;
  };

  if (!Array.isArray(emits) || emits.length === 0) {
    return res.status(400).json({ error: "emits array is required." });
  }

  for (const { room, event, payload } of emits) {
    if (room && event) {
      safeEmit(room, event, payload);
    }
  }

  res.json({ ok: true, count: emits.length });
});

export default router;

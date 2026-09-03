// =============================================================================
// Chat Feature — Route Definitions
// =============================================================================

import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import {
  handleCreateSession,
  handleListMySessions,
  handleListActiveSessions,
  handleGetSession,
  handleSendMessage,
  handleMarkRead,
  handleCloseSession,
} from "./chat.controller";

const router = Router();

// All chat routes require a logged-in user (customer or admin)
router.use(authenticate);

// POST /api/chat/sessions — open a new support session
router.post("/sessions", handleCreateSession);

// GET /api/chat/sessions — customer's own sessions
router.get("/sessions", handleListMySessions);

// GET /api/chat/sessions/active — admin: all open sessions (must precede /:id)
router.get("/sessions/active", handleListActiveSessions);

// GET /api/chat/sessions/:id — session detail + messages (participant only)
router.get("/sessions/:id", handleGetSession);

// POST /api/chat/sessions/:id/messages — send a message
router.post("/sessions/:id/messages", handleSendMessage);

// PATCH /api/chat/sessions/:id/read — mark incoming messages as read
router.patch("/sessions/:id/read", handleMarkRead);

// PATCH /api/chat/sessions/:id/close — close / resolve a session
router.patch("/sessions/:id/close", handleCloseSession);

export default router;

// =============================================================================
// Chat Feature — Route Definitions
// =============================================================================

import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
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

// Image upload for chat (5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
  },
});

function handleMulterError(err: any, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message || "File upload error" });
  }
  next(err);
}

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

// POST /api/chat/sessions/:id/messages — send a message (with optional image)
router.post("/sessions/:id/messages", upload.single("image"), handleMulterError, handleSendMessage);

// PATCH /api/chat/sessions/:id/read — mark incoming messages as read
router.patch("/sessions/:id/read", handleMarkRead);

// PATCH /api/chat/sessions/:id/close — close / resolve a session
router.patch("/sessions/:id/close", handleCloseSession);

export default router;

"use strict";
// =============================================================================
// Chat Feature — Route Definitions
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth.middleware");
const chat_controller_1 = require("./chat.controller");
const router = (0, express_1.Router)();
// All chat routes require a logged-in user (customer or admin)
router.use(auth_middleware_1.authenticate);
// POST /api/chat/sessions — open a new support session
router.post("/sessions", chat_controller_1.handleCreateSession);
// GET /api/chat/sessions — customer's own sessions
router.get("/sessions", chat_controller_1.handleListMySessions);
// GET /api/chat/sessions/active — admin: all open sessions (must precede /:id)
router.get("/sessions/active", chat_controller_1.handleListActiveSessions);
// GET /api/chat/sessions/:id — session detail + messages (participant only)
router.get("/sessions/:id", chat_controller_1.handleGetSession);
// POST /api/chat/sessions/:id/messages — send a message
router.post("/sessions/:id/messages", chat_controller_1.handleSendMessage);
// PATCH /api/chat/sessions/:id/read — mark incoming messages as read
router.patch("/sessions/:id/read", chat_controller_1.handleMarkRead);
// PATCH /api/chat/sessions/:id/close — close / resolve a session
router.patch("/sessions/:id/close", chat_controller_1.handleCloseSession);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map
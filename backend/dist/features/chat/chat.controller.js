"use strict";
// =============================================================================
// Chat Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateSession = handleCreateSession;
exports.handleListMySessions = handleListMySessions;
exports.handleListActiveSessions = handleListActiveSessions;
exports.handleGetSession = handleGetSession;
exports.handleSendMessage = handleSendMessage;
exports.handleMarkRead = handleMarkRead;
exports.handleCloseSession = handleCloseSession;
const chat_service_1 = require("./chat.service");
function handleChatError(err, res) {
    if (err instanceof chat_service_1.ChatError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Chat error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
}
// ---------------------------------------------------------------------------
// POST /api/chat/sessions — open a new support session (authenticated)
// ---------------------------------------------------------------------------
async function handleCreateSession(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "Authentication required." });
        const session = await (0, chat_service_1.createSession)(userId, {
            subject: req.body.subject,
            orderId: req.body.orderId,
        });
        res.status(201).json({ message: "Chat session opened.", data: session });
    }
    catch (err) {
        handleChatError(err, res);
    }
}
// ---------------------------------------------------------------------------
// GET /api/chat/sessions — customer's own sessions
// ---------------------------------------------------------------------------
async function handleListMySessions(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "Authentication required." });
        const sessions = await (0, chat_service_1.listMySessions)(userId);
        res.json({ data: sessions });
    }
    catch (err) {
        handleChatError(err, res);
    }
}
// ---------------------------------------------------------------------------
// GET /api/chat/sessions/active — admin: all open sessions
// ---------------------------------------------------------------------------
async function handleListActiveSessions(req, res) {
    try {
        if (req.user?.role !== "ADMIN") {
            return res.status(403).json({ error: "Admin access required." });
        }
        const status = req.query.status || "OPEN";
        const sessions = await (0, chat_service_1.listActiveSessions)(status);
        res.json({ data: sessions });
    }
    catch (err) {
        handleChatError(err, res);
    }
}
// ---------------------------------------------------------------------------
// GET /api/chat/sessions/:id — full session + messages (participant only)
// ---------------------------------------------------------------------------
async function handleGetSession(req, res) {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role || "CUSTOMER";
        if (!userId)
            return res.status(401).json({ error: "Authentication required." });
        const session = await (0, chat_service_1.getSession)(req.params.id, userId, role);
        res.json({ data: session });
    }
    catch (err) {
        handleChatError(err, res);
    }
}
// ---------------------------------------------------------------------------
// POST /api/chat/sessions/:id/messages — send a message
// ---------------------------------------------------------------------------
async function handleSendMessage(req, res) {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role || "CUSTOMER";
        if (!userId)
            return res.status(401).json({ error: "Authentication required." });
        const message = await (0, chat_service_1.sendMessage)(req.params.id, userId, role, req.body.message);
        res.status(201).json({ message: "Message sent.", data: message });
    }
    catch (err) {
        handleChatError(err, res);
    }
}
// ---------------------------------------------------------------------------
// PATCH /api/chat/sessions/:id/read — mark messages as read
// ---------------------------------------------------------------------------
async function handleMarkRead(req, res) {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role || "CUSTOMER";
        if (!userId)
            return res.status(401).json({ error: "Authentication required." });
        const result = await (0, chat_service_1.markMessagesRead)(req.params.id, userId, role, req.body?.messageIds);
        res.json(result);
    }
    catch (err) {
        handleChatError(err, res);
    }
}
// ---------------------------------------------------------------------------
// PATCH /api/chat/sessions/:id/close — close or resolve a session
// ---------------------------------------------------------------------------
async function handleCloseSession(req, res) {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role || "CUSTOMER";
        if (!userId)
            return res.status(401).json({ error: "Authentication required." });
        const closed = await (0, chat_service_1.closeSession)(req.params.id, userId, role, req.body?.resolve === true);
        res.json({ data: closed, message: "Chat session closed." });
    }
    catch (err) {
        handleChatError(err, res);
    }
}
//# sourceMappingURL=chat.controller.js.map
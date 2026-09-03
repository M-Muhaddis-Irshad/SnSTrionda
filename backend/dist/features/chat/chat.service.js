"use strict";
// =============================================================================
// Chat Feature — Business Logic Service (customer support conversations)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatError = void 0;
exports.createSession = createSession;
exports.listMySessions = listMySessions;
exports.listActiveSessions = listActiveSessions;
exports.getSession = getSession;
exports.sendMessage = sendMessage;
exports.closeSession = closeSession;
exports.markMessagesRead = markMessagesRead;
const db_1 = require("../../db");
const socketService_1 = require("../../services/socketService");
// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------
class ChatError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ChatError";
    }
}
exports.ChatError = ChatError;
// ---------------------------------------------------------------------------
// Session visibility helper
// ---------------------------------------------------------------------------
async function assertAccess(sessionId, actorId, role) {
    const session = await db_1.prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
            customer: { select: { id: true, name: true, email: true } },
            admin: { select: { id: true, name: true, email: true } },
            order: { select: { id: true, orderNumber: true, status: true } },
            messages: { orderBy: { createdAt: "asc" } },
        },
    });
    if (!session) {
        throw new ChatError("Chat session not found.", 404);
    }
    const isParticipant = session.customerId === actorId || role === "ADMIN" || session.adminId === actorId;
    if (!isParticipant) {
        throw new ChatError("You do not have access to this chat session.", 403);
    }
    return session;
}
async function createSession(customerId, input) {
    const subject = input.subject?.trim();
    if (!subject) {
        throw new ChatError("Subject is required.", 400);
    }
    if (subject.length > 200) {
        throw new ChatError("Subject must be 200 characters or less.", 400);
    }
    // If linked to an order, verify the order belongs to this customer
    if (input.orderId) {
        const order = await db_1.prisma.order.findUnique({ where: { id: input.orderId } });
        if (!order)
            throw new ChatError("Order not found.", 404);
        if (order.userId !== customerId) {
            throw new ChatError("You can only open a chat about your own orders.", 403);
        }
    }
    const customer = await db_1.prisma.user.findUnique({
        where: { id: customerId },
        select: { id: true, name: true, email: true },
    });
    if (!customer)
        throw new ChatError("User not found.", 404);
    const session = await db_1.prisma.chatSession.create({
        data: {
            customerId,
            orderId: input.orderId || null,
            subject,
            status: "OPEN",
        },
    });
    // Notify the admin room that a new support session just opened
    (0, socketService_1.notifyAdminsNewChatSession)({ id: session.id, subject: session.subject, customer }).catch((err) => console.error("chat:session-opened notify failed:", err));
    return session;
}
// Customer's own sessions (most recent first, with last message preview)
async function listMySessions(userId) {
    return db_1.prisma.chatSession.findMany({
        where: { customerId: userId },
        orderBy: { updatedAt: "desc" },
        include: {
            order: { select: { id: true, orderNumber: true, status: true } },
            admin: { select: { id: true, name: true } },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
            _count: { select: { messages: true } },
        },
    });
}
// Admin: sessions with customer info + last message preview.
// statusFilter: OPEN (default) | RESOLVED | CLOSED | ALL
async function listActiveSessions(statusFilter) {
    const where = {};
    if (statusFilter && statusFilter !== "ALL") {
        where.status = statusFilter;
    }
    return db_1.prisma.chatSession.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: {
            customer: { select: { id: true, name: true, email: true, phone: true } },
            admin: { select: { id: true, name: true } },
            order: { select: { id: true, orderNumber: true, status: true, total: true } },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
            _count: { select: { messages: true } },
        },
    });
}
async function getSession(sessionId, actorId, role) {
    const session = await assertAccess(sessionId, actorId, role);
    const unreadCount = session.messages.filter((m) => m.senderId !== actorId && !m.read).length;
    return { ...session, unreadCount };
}
// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
async function sendMessage(sessionId, senderId, role, text) {
    const message = text?.trim();
    if (!message) {
        throw new ChatError("Message cannot be empty.", 400);
    }
    if (message.length > 2000) {
        throw new ChatError("Message must be 2000 characters or less.", 400);
    }
    const session = await assertAccess(sessionId, senderId, role);
    const sender = await db_1.prisma.user.findUnique({
        where: { id: senderId },
        select: { id: true, name: true, email: true, role: true },
    });
    if (!sender)
        throw new ChatError("Sender not found.", 404);
    // Admins replying to an unassigned session lock in as the assigned admin;
    // customer messages on a closed session reopen it.
    const updateData = {};
    if (role === "ADMIN" && !session.adminId)
        updateData.adminId = senderId;
    if (session.status !== "OPEN")
        updateData.status = "OPEN";
    const [, saved] = await db_1.prisma.$transaction([
        db_1.prisma.chatSession.update({
            where: { id: sessionId },
            data: updateData,
        }),
        db_1.prisma.chatMessage.create({
            data: { chatSessionId: sessionId, senderId, message },
        }),
    ]);
    const payload = {
        chatSessionId: sessionId,
        messageId: saved.id,
        senderId,
        senderName: sender.name || sender.email || "User",
        senderRole: role,
        message: saved.message,
        createdAt: saved.createdAt,
    };
    // Live message to whoever is viewing the session
    (0, socketService_1.safeEmit)(`chat:${sessionId}`, "chat:message-received", payload);
    // Notify the OTHER participant + nudge the admin room for customer messages
    const isCustomerSender = session.customerId === senderId;
    if (isCustomerSender) {
        // Admins get a lightweight badge nudge even when not viewing the session
        (0, socketService_1.safeEmit)("admin", "chat:customer-message", payload);
    }
    else {
        const recipientId = session.customerId;
        await (0, socketService_1.createNotification)(recipientId, "CHAT_MESSAGE", `New reply — ${session.subject}`, `${sender.name || "Support"}: ${saved.message}`, { chatSessionId: sessionId, subject: session.subject });
    }
    return saved;
}
// ---------------------------------------------------------------------------
// Close / resolve / read receipts
// ---------------------------------------------------------------------------
async function closeSession(sessionId, actorId, role, resolve) {
    const session = await assertAccess(sessionId, actorId, role);
    const isParticipant = session.customerId === actorId || role === "ADMIN" || session.adminId === actorId;
    if (!isParticipant) {
        throw new ChatError("You do not have access to this chat session.", 403);
    }
    const closed = await db_1.prisma.chatSession.update({
        where: { id: sessionId },
        data: { status: resolve ? "RESOLVED" : "CLOSED" },
    });
    (0, socketService_1.safeEmit)(`chat:${sessionId}`, "chat:session-closed", {
        chatSessionId: sessionId,
        status: closed.status,
        closedAt: new Date().toISOString(),
    });
    (0, socketService_1.safeEmit)("admin", "chat:session-closed", {
        chatSessionId: sessionId,
        status: closed.status,
    });
    return closed;
}
async function markMessagesRead(sessionId, actorId, role, messageIds) {
    const session = await assertAccess(sessionId, actorId, role);
    const isParticipant = session.customerId === actorId || role === "ADMIN" || session.adminId === actorId;
    if (!isParticipant) {
        throw new ChatError("You do not have access to this chat session.", 403);
    }
    const result = await db_1.prisma.chatMessage.updateMany({
        where: {
            chatSessionId: sessionId,
            senderId: { not: actorId },
            read: false,
            ...(messageIds && messageIds.length > 0 ? { id: { in: messageIds } } : {}),
        },
        data: { read: true, readAt: new Date() },
    });
    (0, socketService_1.safeEmit)(`chat:${sessionId}`, "chat:message-read", {
        chatSessionId: sessionId,
        actorId,
        readAt: new Date().toISOString(),
    });
    return { updated: result.count };
}
//# sourceMappingURL=chat.service.js.map
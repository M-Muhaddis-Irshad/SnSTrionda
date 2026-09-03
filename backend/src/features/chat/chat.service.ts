// =============================================================================
// Chat Feature — Business Logic Service (customer support conversations)
// =============================================================================

import { prisma } from "../../db";
import {
  createNotification,
  safeEmit,
  notifyAdminsNewChatSession,
} from "../../services/socketService";

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class ChatError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ChatError";
  }
}

// ---------------------------------------------------------------------------
// Session visibility helper
// ---------------------------------------------------------------------------

async function assertAccess(sessionId: string, actorId: string, role: string) {
  const session = await prisma.chatSession.findUnique({
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

  const isParticipant =
    session.customerId === actorId || role === "ADMIN" || session.adminId === actorId;
  if (!isParticipant) {
    throw new ChatError("You do not have access to this chat session.", 403);
  }

  return session;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface CreateSessionInput {
  subject: string;
  orderId?: string;
}

export async function createSession(customerId: string, input: CreateSessionInput) {
  const subject = input.subject?.trim();
  if (!subject) {
    throw new ChatError("Subject is required.", 400);
  }
  if (subject.length > 200) {
    throw new ChatError("Subject must be 200 characters or less.", 400);
  }

  // If linked to an order, verify the order belongs to this customer
  if (input.orderId) {
    const order = await prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new ChatError("Order not found.", 404);
    if (order.userId !== customerId) {
      throw new ChatError("You can only open a chat about your own orders.", 403);
    }
  }

  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, email: true },
  });
  if (!customer) throw new ChatError("User not found.", 404);

  const session = await prisma.chatSession.create({
    data: {
      customerId,
      orderId: input.orderId || null,
      subject,
      status: "OPEN",
    },
  });

  // Notify the admin room that a new support session just opened
  notifyAdminsNewChatSession({ id: session.id, subject: session.subject, customer }).catch(
    (err) => console.error("chat:session-opened notify failed:", err)
  );

  return session;
}

// Customer's own sessions (most recent first, with last message preview)
export async function listMySessions(userId: string) {
  return prisma.chatSession.findMany({
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
export async function listActiveSessions(statusFilter?: string) {
  const where: any = {};
  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter;
  }
  return prisma.chatSession.findMany({
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

export async function getSession(sessionId: string, actorId: string, role: string) {
  const session = await assertAccess(sessionId, actorId, role);

  const unreadCount = session.messages.filter(
    (m) => m.senderId !== actorId && !m.read
  ).length;

  return { ...session, unreadCount };
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function sendMessage(
  sessionId: string,
  senderId: string,
  role: string,
  text: string
) {
  const message = text?.trim();
  if (!message) {
    throw new ChatError("Message cannot be empty.", 400);
  }
  if (message.length > 2000) {
    throw new ChatError("Message must be 2000 characters or less.", 400);
  }

  const session = await assertAccess(sessionId, senderId, role);

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!sender) throw new ChatError("Sender not found.", 404);

  // Admins replying to an unassigned session lock in as the assigned admin;
  // customer messages on a closed session reopen it.
  const updateData: any = {};
  if (role === "ADMIN" && !session.adminId) updateData.adminId = senderId;
  if (session.status !== "OPEN") updateData.status = "OPEN";

  const [, saved] = await prisma.$transaction([
    prisma.chatSession.update({
      where: { id: sessionId },
      data: updateData,
    }),
    prisma.chatMessage.create({
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
  safeEmit(`chat:${sessionId}`, "chat:message-received", payload);

  // Notify the OTHER participant + nudge the admin room for customer messages
  const isCustomerSender = session.customerId === senderId;
  if (isCustomerSender) {
    // Admins get a lightweight badge nudge even when not viewing the session
    safeEmit("admin", "chat:customer-message", payload);
  } else {
    const recipientId = session.customerId;
    await createNotification(
      recipientId,
      "CHAT_MESSAGE",
      `New reply — ${session.subject}`,
      `${sender.name || "Support"}: ${saved.message}`,
      { chatSessionId: sessionId, subject: session.subject }
    );
  }

  return saved;
}

// ---------------------------------------------------------------------------
// Close / resolve / read receipts
// ---------------------------------------------------------------------------

export async function closeSession(
  sessionId: string,
  actorId: string,
  role: string,
  resolve: boolean
) {
  const session = await assertAccess(sessionId, actorId, role);
  const isParticipant =
    session.customerId === actorId || role === "ADMIN" || session.adminId === actorId;
  if (!isParticipant) {
    throw new ChatError("You do not have access to this chat session.", 403);
  }

  const closed = await prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: resolve ? "RESOLVED" : "CLOSED" },
  });

  safeEmit(`chat:${sessionId}`, "chat:session-closed", {
    chatSessionId: sessionId,
    status: closed.status,
    closedAt: new Date().toISOString(),
  });
  safeEmit("admin", "chat:session-closed", {
    chatSessionId: sessionId,
    status: closed.status,
  });

  return closed;
}

export async function markMessagesRead(
  sessionId: string,
  actorId: string,
  role: string,
  messageIds?: string[]
) {
  const session = await assertAccess(sessionId, actorId, role);
  const isParticipant =
    session.customerId === actorId || role === "ADMIN" || session.adminId === actorId;
  if (!isParticipant) {
    throw new ChatError("You do not have access to this chat session.", 403);
  }

  const result = await prisma.chatMessage.updateMany({
    where: {
      chatSessionId: sessionId,
      senderId: { not: actorId },
      read: false,
      ...(messageIds && messageIds.length > 0 ? { id: { in: messageIds } } : {}),
    },
    data: { read: true, readAt: new Date() },
  });

  safeEmit(`chat:${sessionId}`, "chat:message-read", {
    chatSessionId: sessionId,
    actorId,
    readAt: new Date().toISOString(),
  });

  return { updated: result.count };
}

import { prisma } from "../../db";
import cloudinary from "../../config/cloudinary";
import { safeEmit, createNotification, notifyAdminsNewChatSession } from "../../services/socketService";

// Custom Error
export class ChatError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ChatError";
  }
}

// Upload image to Cloudinary
async function uploadChatImage(file: Express.Multer.File): Promise<string> {
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ChatError("Invalid file type. Allowed: JPEG, PNG, WebP, GIF.", 400);
  }

  const result = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "trionda-wears/chat",
        public_id: `chat-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed"));
        resolve(result);
      }
    );
    uploadStream.end(file.buffer);
  });

  return result.secure_url;
}

// Create session
export async function createSession(customerId: string, input: { subject: string; orderId?: string }) {
  const subject = input.subject?.trim();
  if (!subject) throw new ChatError("Subject is required.", 400);
  if (subject.length > 200) throw new ChatError("Subject must be 200 characters or less.", 400);

  if (input.orderId) {
    const order = await prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new ChatError("Order not found", 404);
    if (order.userId !== customerId) throw new ChatError("You can only open a chat about your own orders.", 403);
  }

  const customer = await prisma.user.findUnique({ where: { id: customerId }, select: { id: true, name: true, email: true } });
  if (!customer) throw new ChatError("User not found", 404);

  const session = await prisma.chatSession.create({
    data: { customerId, orderId: input.orderId || null, subject, status: "OPEN" },
  });

  notifyAdminsNewChatSession({ id: session.id, subject: session.subject, customer }).catch(() => {});
  return session;
}

// Customer's own sessions
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

// Admin: all sessions
export async function listActiveSessions(statusFilter?: string) {
  const where: any = {};
  if (statusFilter && statusFilter !== "ALL") where.status = statusFilter;

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

// Assert access
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

  if (!session) throw new ChatError("Chat session not found.", 404);
  const isParticipant = session.customerId === actorId || role === "ADMIN" || session.adminId === actorId;
  if (!isParticipant) throw new ChatError("You do not have access to this chat session.", 403);
  return session;
}

// Get session
export async function getSession(sessionId: string, actorId: string, role: string) {
  const session = await assertAccess(sessionId, actorId, role);
  const unreadCount = session.messages.filter((m) => m.senderId !== actorId && !m.read).length;
  return { ...session, unreadCount };
}

// Send message (text + optional image)
export async function sendMessage(sessionId: string, senderId: string, role: string, text: string, imageUrl?: string) {
  const message = text?.trim();
  if (!message && !imageUrl) throw new ChatError("Message cannot be empty.", 400);
  if (message && message.length > 2000) throw new ChatError("Message must be 2000 characters or less.", 400);

  const session = await assertAccess(sessionId, senderId, role);
  const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { id: true, name: true, email: true, role: true } });
  if (!sender) throw new ChatError("Sender not found", 404);

  const updateData: any = {};
  if (role === "ADMIN" && !session.adminId) updateData.adminId = senderId;
  if (session.status !== "OPEN") updateData.status = "OPEN";

  const [, saved] = await prisma.$transaction([
    prisma.chatSession.update({ where: { id: sessionId }, data: updateData }),
    prisma.chatMessage.create({
      data: { chatSessionId: sessionId, senderId, message: message || "", imageUrl: imageUrl || null },
    }),
  ]);

  const payload = {
    chatSessionId: sessionId,
    messageId: saved.id,
    senderId,
    senderName: sender.name || sender.email || "User",
    senderRole: role,
    message: saved.message,
    imageUrl: saved.imageUrl,
    createdAt: saved.createdAt,
  };

  safeEmit(`chat:${sessionId}`, "chat:message-received", payload);

  if (session.customerId === senderId) {
    safeEmit("admin", "chat:customer-message", payload);
  } else {
    await createNotification(
      session.customerId,
      "CHAT_MESSAGE",
      `New reply — ${session.subject}`,
      `${sender.name || "Support"}: ${saved.message || "sent an image"}`,
      { chatSessionId: sessionId, subject: session.subject }
    );
  }

  return saved;
}

// Close session
export async function closeSession(sessionId: string, actorId: string, role: string, resolve: boolean) {
  const session = await assertAccess(sessionId, actorId, role);
  const closed = await prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: resolve ? "RESOLVED" : "CLOSED" },
  });

  safeEmit(`chat:${sessionId}`, "chat:session-closed", { chatSessionId: sessionId, status: closed.status, closedAt: new Date().toISOString() });
  safeEmit("admin", "chat:session-closed", { chatSessionId: sessionId, status: closed.status });
  return closed;
}

// Mark messages read
export async function markMessagesRead(sessionId: string, actorId: string, role: string, messageIds?: string[]) {
  const session = await assertAccess(sessionId, actorId, role);
  const result = await prisma.chatMessage.updateMany({
    where: {
      chatSessionId: sessionId,
      senderId: { not: actorId },
      read: false,
      ...(messageIds && messageIds.length > 0 ? { id: { in: messageIds } } : {}),
    },
    data: { read: true, readAt: new Date() },
  });

  safeEmit(`chat:${sessionId}`, "chat:message-read", { chatSessionId: sessionId, actorId, readAt: new Date().toISOString() });
  return { updated: result.count };
}
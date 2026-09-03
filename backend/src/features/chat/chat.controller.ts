// =============================================================================
// Chat Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  createSession,
  listMySessions,
  listActiveSessions,
  getSession,
  sendMessage,
  closeSession,
  markMessagesRead,
  ChatError,
} from "./chat.service";

function handleChatError(err: any, res: Response) {
  if (err instanceof ChatError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("Chat error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

// ---------------------------------------------------------------------------
// POST /api/chat/sessions — open a new support session (authenticated)
// ---------------------------------------------------------------------------

export async function handleCreateSession(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Authentication required." });

    const session = await createSession(userId, {
      subject: req.body.subject,
      orderId: req.body.orderId,
    });

    res.status(201).json({ message: "Chat session opened.", data: session });
  } catch (err: any) {
    handleChatError(err, res);
  }
}

// ---------------------------------------------------------------------------
// GET /api/chat/sessions — customer's own sessions
// ---------------------------------------------------------------------------

export async function handleListMySessions(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Authentication required." });

    const sessions = await listMySessions(userId);
    res.json({ data: sessions });
  } catch (err: any) {
    handleChatError(err, res);
  }
}

// ---------------------------------------------------------------------------
// GET /api/chat/sessions/active — admin: all open sessions
// ---------------------------------------------------------------------------

export async function handleListActiveSessions(req: Request, res: Response) {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required." });
    }
    const status = (req.query.status as string) || "OPEN";
    const sessions = await listActiveSessions(status);
    res.json({ data: sessions });
  } catch (err: any) {
    handleChatError(err, res);
  }
}

// ---------------------------------------------------------------------------
// GET /api/chat/sessions/:id — full session + messages (participant only)
// ---------------------------------------------------------------------------

export async function handleGetSession(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role || "CUSTOMER";
    if (!userId) return res.status(401).json({ error: "Authentication required." });

    const session = await getSession(req.params.id as string, userId, role);
    res.json({ data: session });
  } catch (err: any) {
    handleChatError(err, res);
  }
}

// ---------------------------------------------------------------------------
// POST /api/chat/sessions/:id/messages — send a message
// ---------------------------------------------------------------------------

export async function handleSendMessage(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role || "CUSTOMER";
    if (!userId) return res.status(401).json({ error: "Authentication required." });

    const message = await sendMessage(
      req.params.id as string,
      userId,
      role,
      req.body.message
    );

    res.status(201).json({ message: "Message sent.", data: message });
  } catch (err: any) {
    handleChatError(err, res);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/chat/sessions/:id/read — mark messages as read
// ---------------------------------------------------------------------------

export async function handleMarkRead(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role || "CUSTOMER";
    if (!userId) return res.status(401).json({ error: "Authentication required." });

    const result = await markMessagesRead(
      req.params.id as string,
      userId,
      role,
      req.body?.messageIds
    );
    res.json(result);
  } catch (err: any) {
    handleChatError(err, res);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/chat/sessions/:id/close — close or resolve a session
// ---------------------------------------------------------------------------

export async function handleCloseSession(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role || "CUSTOMER";
    if (!userId) return res.status(401).json({ error: "Authentication required." });

    const closed = await closeSession(
      req.params.id as string,
      userId,
      role,
      req.body?.resolve === true
    );
    res.json({ data: closed, message: "Chat session closed." });
  } catch (err: any) {
    handleChatError(err, res);
  }
}

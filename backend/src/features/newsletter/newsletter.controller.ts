// =============================================================================
// Newsletter — Request Handlers
// =============================================================================

import { Request, Response } from "express";
import { subscribe, unsubscribe, listSubscribers, NewsletterError } from "./newsletter.service";

function handleError(err: any, res: Response) {
  if (err instanceof NewsletterError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("Newsletter error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

// Public — POST /api/newsletter/subscribe
export async function handleSubscribe(req: Request, res: Response) {
  try {
    const result = await subscribe(req.body.email);
    res.status(201).json(result);
  } catch (err: any) {
    handleError(err, res);
  }
}

// Public — POST /api/newsletter/unsubscribe
export async function handleUnsubscribe(req: Request, res: Response) {
  try {
    const result = await unsubscribe(req.body.email);
    res.json(result);
  } catch (err: any) {
    handleError(err, res);
  }
}

// Admin — GET /api/admin/newsletter
export async function handleListSubscribers(_req: Request, res: Response) {
  try {
    const subscribers = await listSubscribers();
    res.json({ data: subscribers });
  } catch (err: any) {
    handleError(err, res);
  }
}

// =============================================================================
// Newsletter — Route Definitions
// =============================================================================

import { Router } from "express";
import { handleSubscribe, handleUnsubscribe, handleListSubscribers } from "./newsletter.controller";

const router = Router();

// Public — anyone can subscribe
router.post("/subscribe", handleSubscribe);
router.post("/unsubscribe", handleUnsubscribe);

// Admin — list all subscribers
export const newsletterAdminRoutes = Router();
newsletterAdminRoutes.get("/", handleListSubscribers);

export default router;

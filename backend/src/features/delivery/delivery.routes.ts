// =============================================================================
// Delivery Feature — Public Route Definitions
// =============================================================================

import { Router } from "express";
import { handleListDeliveryZones } from "./delivery.controller";

const router = Router();

// GET /api/delivery-zones — public list of active zones (checkout dropdown + map)
router.get("/", handleListDeliveryZones);

export default router;
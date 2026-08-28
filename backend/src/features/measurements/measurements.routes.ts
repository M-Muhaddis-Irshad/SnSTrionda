// =============================================================================
// Measurements Feature — Route Definitions
// =============================================================================

import { Router } from "express";
import { handleCreateMeasurement } from "./measurements.controller";

const router = Router();

router.post("/", handleCreateMeasurement);

export default router;

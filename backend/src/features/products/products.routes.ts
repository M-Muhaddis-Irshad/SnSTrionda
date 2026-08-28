// =============================================================================
// Products Feature — Route Definitions
// =============================================================================

import { Router } from "express";
import { handleListProducts, handleGetProductBySlug } from "./products.controller";

const router = Router();

router.get("/", handleListProducts);
router.get("/:slug", handleGetProductBySlug);

export default router;

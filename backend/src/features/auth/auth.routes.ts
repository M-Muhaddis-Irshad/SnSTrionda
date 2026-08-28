// =============================================================================
// Auth Feature — Route Definitions
// =============================================================================

import { Router } from "express";
import {
  handleRegister,
  handleLogin,
  handleRefresh,
  handleLogout,
} from "./auth.controller";

const router = Router();

router.post("/register", handleRegister);
router.post("/login", handleLogin);
router.post("/refresh", handleRefresh);
router.post("/logout", handleLogout);

export default router;

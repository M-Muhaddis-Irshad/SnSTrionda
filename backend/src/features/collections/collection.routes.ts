// =============================================================================
// Collections Feature — Route Definitions
// =============================================================================
// Public:  GET  /api/collections (active collections with products)
// Admin:   /api/admin/collections (mounted behind the admin auth middleware)
// =============================================================================

import { Router } from "express";
import {
  handleListPublicCollections,
  handleListCollections,
  handleCreateCollection,
  handleUpdateCollection,
  handleDeleteCollection,
} from "./collection.controller";

// Public routes
export const collectionPublicRoutes = Router();
collectionPublicRoutes.get("/", handleListPublicCollections);

// Admin routes (auth handled by the admin router that mounts this)
export const collectionAdminRoutes = Router();
collectionAdminRoutes.get("/", handleListCollections);
collectionAdminRoutes.post("/", handleCreateCollection);
collectionAdminRoutes.put("/:collectionId", handleUpdateCollection);
collectionAdminRoutes.delete("/:collectionId", handleDeleteCollection);

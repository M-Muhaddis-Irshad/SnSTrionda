// =============================================================================
// Collections Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  listCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  listPublicCollections,
  CollectionError,
} from "./collection.service";
import { logAdminActivity, broadcastCatalogChange } from "../../services/socketService";

function handleError(err: any, res: Response) {
  if (err instanceof CollectionError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("Collection error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

// ---------------------------------------------------------------------------
// Public — GET /api/collections (active collections with products)
// ---------------------------------------------------------------------------

export async function handleListPublicCollections(_req: Request, res: Response) {
  try {
    const collections = await listPublicCollections();
    res.json({ data: collections });
  } catch (err: any) {
    console.error("List public collections error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------
// Admin CRUD
// ---------------------------------------------------------------------------

export async function handleListCollections(_req: Request, res: Response) {
  try {
    const collections = await listCollections();
    res.json({ data: collections });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleCreateCollection(req: Request, res: Response) {
  try {
    const collection = await createCollection(req.body);
    res.status(201).json({ data: collection, message: "Collection created successfully" });
    track(req, "CREATE_COLLECTION", "Collection", collection.id, { name: collection.name });
    broadcastCatalogChange("created", "collection", { id: collection.id, name: collection.name });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleUpdateCollection(req: Request, res: Response) {
  try {
    const collection = await updateCollection(req.params.collectionId as string, req.body);
    res.json({ data: collection, message: "Collection updated successfully" });
    track(req, "UPDATE_COLLECTION", "Collection", collection.id, { name: collection.name });
    broadcastCatalogChange("updated", "collection", { id: collection.id, name: collection.name });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleDeleteCollection(req: Request, res: Response) {
  try {
    const collectionId = req.params.collectionId as string;
    const result = await deleteCollection(collectionId);
    res.json({ ...result, message: "Collection deleted successfully" });
    track(req, "DELETE_COLLECTION", "Collection", collectionId);
    broadcastCatalogChange("deleted", "collection", { id: collectionId });
  } catch (err: any) {
    handleError(err, res);
  }
}

function track(
  req: Request,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>
) {
  const adminId = req.user?.userId;
  if (!adminId) return;
  logAdminActivity(adminId, action, entityType, entityId, details ?? null).catch(() => {});
}

// =============================================================================
// Delivery Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  listDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  getDeliveryZone,
  DeliveryError,
  DeliveryZoneInput,
} from "./delivery.service";
import { logAdminActivity } from "../../services/socketService";

// Fire-and-forget audit trail entry
function track(adminId: string | undefined, action: string, entityId: string, details?: Record<string, unknown>) {
  if (!adminId) return;
  logAdminActivity(adminId, action, "DeliveryZone", entityId, details ?? null).catch(() => {});
}

function handleDeliveryError(err: any, res: Response) {
  if (err instanceof DeliveryError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("Delivery error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

// ---------------------------------------------------------------------------
// GET /api/delivery-zones — public (active zones only, for checkout + map)
// ---------------------------------------------------------------------------

export async function handleListDeliveryZones(_req: Request, res: Response) {
  try {
    const zones = await listDeliveryZones(false);
    res.json({ data: zones });
  } catch (err: any) {
    handleDeliveryError(err, res);
  }
}

// ===========================================================================
// ADMIN — mounted under /api/admin/delivery-zones
// ===========================================================================

export async function handleAdminListDeliveryZones(_req: Request, res: Response) {
  try {
    const zones = await listDeliveryZones(true);
    res.json({ data: zones });
  } catch (err: any) {
    handleDeliveryError(err, res);
  }
}

export async function handleAdminGetDeliveryZone(req: Request, res: Response) {
  try {
    const zone = await getDeliveryZone(req.params.id as string);
    res.json({ data: zone });
  } catch (err: any) {
    handleDeliveryError(err, res);
  }
}

export async function handleAdminCreateDeliveryZone(req: Request, res: Response) {
  try {
    const body = req.body as DeliveryZoneInput;
    const zone = await createDeliveryZone({
      name: body.name,
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      deliveryCharges: Number(body.deliveryCharges),
      estimatedDays: body.estimatedDays !== undefined ? Number(body.estimatedDays) : undefined,
      active: body.active,
    });
    res.status(201).json({ data: zone, message: "Delivery zone created successfully" });
    track(req.user?.userId, "CREATE_DELIVERY_ZONE", zone.id, { name: zone.name });
  } catch (err: any) {
    handleDeliveryError(err, res);
  }
}

export async function handleAdminUpdateDeliveryZone(req: Request, res: Response) {
  try {
    const body = req.body as Partial<DeliveryZoneInput>;
    const zone = await updateDeliveryZone(req.params.id as string, {
      name: body.name,
      latitude: body.latitude !== undefined ? Number(body.latitude) : undefined,
      longitude: body.longitude !== undefined ? Number(body.longitude) : undefined,
      deliveryCharges: body.deliveryCharges !== undefined ? Number(body.deliveryCharges) : undefined,
      estimatedDays: body.estimatedDays !== undefined ? Number(body.estimatedDays) : undefined,
      active: body.active,
    });
    res.json({ data: zone, message: "Delivery zone updated successfully" });
    track(req.user?.userId, "UPDATE_DELIVERY_ZONE", req.params.id as string, {
      name: zone?.name,
    });
  } catch (err: any) {
    handleDeliveryError(err, res);
  }
}

export async function handleAdminDeleteDeliveryZone(req: Request, res: Response) {
  try {
    const result = await deleteDeliveryZone(req.params.id as string);
    res.json({ ...result, message: "Delivery zone deleted successfully" });
    track(req.user?.userId, "DELETE_DELIVERY_ZONE", result.id);
  } catch (err: any) {
    handleDeliveryError(err, res);
  }
}
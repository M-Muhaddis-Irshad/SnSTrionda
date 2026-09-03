// =============================================================================
// Delivery Feature — Business Logic Service (Pakistan delivery zones)
// =============================================================================

import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class DeliveryError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "DeliveryError";
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface DeliveryZoneInput {
  name: string;
  latitude: number;
  longitude: number;
  deliveryCharges: number;
  estimatedDays?: number;
  active?: boolean;
}

export function validateZoneInput(input: DeliveryZoneInput): void {
  if (!input.name || !input.name.trim()) {
    throw new DeliveryError("City name is required.", 400);
  }
  if (
    typeof input.latitude !== "number" ||
    isNaN(input.latitude) ||
    input.latitude < -90 ||
    input.latitude > 90
  ) {
    throw new DeliveryError("Latitude must be between -90 and 90.", 400);
  }
  if (
    typeof input.longitude !== "number" ||
    isNaN(input.longitude) ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    throw new DeliveryError("Longitude must be between -180 and 180.", 400);
  }
  if (
    typeof input.deliveryCharges !== "number" ||
    !Number.isFinite(input.deliveryCharges) ||
    input.deliveryCharges <= 0
  ) {
    throw new DeliveryError("Delivery charges must be greater than 0.", 400);
  }
  if (
    input.estimatedDays !== undefined &&
    (!Number.isInteger(input.estimatedDays) ||
      input.estimatedDays < 1 ||
      input.estimatedDays > 7)
  ) {
    throw new DeliveryError("Estimated days must be a whole number between 1 and 7.", 400);
  }
}

// ---------------------------------------------------------------------------
// List zones — public endpoint returns active zones only; admin may list all
// ---------------------------------------------------------------------------

export async function listDeliveryZones(includeInactive = false) {
  return prisma.deliveryZone.findMany({
    where: includeInactive ? undefined : { active: true },
    orderBy: [{ name: "asc" }],
  });
}

// ---------------------------------------------------------------------------
// Get single zone
// ---------------------------------------------------------------------------

export async function getDeliveryZone(id: string) {
  const zone = await prisma.deliveryZone.findUnique({ where: { id } });
  if (!zone) {
    throw new DeliveryError("Delivery zone not found.", 404);
  }
  return zone;
}

// ---------------------------------------------------------------------------
// Create zone
// ---------------------------------------------------------------------------

export async function createDeliveryZone(input: DeliveryZoneInput) {
  validateZoneInput(input);

  const existing = await prisma.deliveryZone.findUnique({
    where: { name: input.name.trim() },
  });
  if (existing) {
    throw new DeliveryError(`A delivery zone named "${input.name.trim()}" already exists.`, 409);
  }

  return prisma.deliveryZone.create({
    data: {
      name: input.name.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      deliveryCharges: Math.round(input.deliveryCharges),
      estimatedDays: input.estimatedDays ?? 2,
      active: input.active ?? true,
    },
  });
}

// ---------------------------------------------------------------------------
// Update zone
// ---------------------------------------------------------------------------

export async function updateDeliveryZone(id: string, input: Partial<DeliveryZoneInput>) {
  const existing = await getDeliveryZone(id);

  const next: DeliveryZoneInput = {
    name: input.name?.trim() ?? existing.name,
    latitude: input.latitude ?? existing.latitude,
    longitude: input.longitude ?? existing.longitude,
    deliveryCharges: input.deliveryCharges ?? existing.deliveryCharges,
    estimatedDays: input.estimatedDays ?? existing.estimatedDays,
    active: input.active ?? existing.active,
  };
  validateZoneInput(next);

  // Name uniqueness (excluding self)
  if (next.name !== existing.name) {
    const dup = await prisma.deliveryZone.findFirst({
      where: { name: next.name, id: { not: id } },
    });
    if (dup) {
      throw new DeliveryError(`A delivery zone named "${next.name}" already exists.`, 409);
    }
  }

  return prisma.deliveryZone.update({
    where: { id },
    data: {
      name: next.name,
      latitude: next.latitude,
      longitude: next.longitude,
      deliveryCharges: Math.round(next.deliveryCharges),
      estimatedDays: next.estimatedDays,
      active: next.active,
    },
  });
}

// ---------------------------------------------------------------------------
// Delete zone
// ---------------------------------------------------------------------------

export async function deleteDeliveryZone(id: string) {
  await getDeliveryZone(id);
  await prisma.deliveryZone.delete({ where: { id } });
  return { deleted: true, id };
}
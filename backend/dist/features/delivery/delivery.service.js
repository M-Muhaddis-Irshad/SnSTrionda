"use strict";
// =============================================================================
// Delivery Feature — Business Logic Service (Pakistan delivery zones)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryError = void 0;
exports.validateZoneInput = validateZoneInput;
exports.listDeliveryZones = listDeliveryZones;
exports.getDeliveryZone = getDeliveryZone;
exports.createDeliveryZone = createDeliveryZone;
exports.updateDeliveryZone = updateDeliveryZone;
exports.deleteDeliveryZone = deleteDeliveryZone;
const db_1 = require("../../db");
// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------
class DeliveryError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "DeliveryError";
    }
}
exports.DeliveryError = DeliveryError;
function validateZoneInput(input) {
    if (!input.name || !input.name.trim()) {
        throw new DeliveryError("City name is required.", 400);
    }
    if (typeof input.latitude !== "number" ||
        isNaN(input.latitude) ||
        input.latitude < -90 ||
        input.latitude > 90) {
        throw new DeliveryError("Latitude must be between -90 and 90.", 400);
    }
    if (typeof input.longitude !== "number" ||
        isNaN(input.longitude) ||
        input.longitude < -180 ||
        input.longitude > 180) {
        throw new DeliveryError("Longitude must be between -180 and 180.", 400);
    }
    if (typeof input.deliveryCharges !== "number" ||
        !Number.isFinite(input.deliveryCharges) ||
        input.deliveryCharges <= 0) {
        throw new DeliveryError("Delivery charges must be greater than 0.", 400);
    }
    if (input.estimatedDays !== undefined &&
        (!Number.isInteger(input.estimatedDays) ||
            input.estimatedDays < 1 ||
            input.estimatedDays > 7)) {
        throw new DeliveryError("Estimated days must be a whole number between 1 and 7.", 400);
    }
}
// ---------------------------------------------------------------------------
// List zones — public endpoint returns active zones only; admin may list all
// ---------------------------------------------------------------------------
async function listDeliveryZones(includeInactive = false) {
    return db_1.prisma.deliveryZone.findMany({
        where: includeInactive ? undefined : { active: true },
        orderBy: [{ name: "asc" }],
    });
}
// ---------------------------------------------------------------------------
// Get single zone
// ---------------------------------------------------------------------------
async function getDeliveryZone(id) {
    const zone = await db_1.prisma.deliveryZone.findUnique({ where: { id } });
    if (!zone) {
        throw new DeliveryError("Delivery zone not found.", 404);
    }
    return zone;
}
// ---------------------------------------------------------------------------
// Create zone
// ---------------------------------------------------------------------------
async function createDeliveryZone(input) {
    validateZoneInput(input);
    const existing = await db_1.prisma.deliveryZone.findUnique({
        where: { name: input.name.trim() },
    });
    if (existing) {
        throw new DeliveryError(`A delivery zone named "${input.name.trim()}" already exists.`, 409);
    }
    return db_1.prisma.deliveryZone.create({
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
async function updateDeliveryZone(id, input) {
    const existing = await getDeliveryZone(id);
    const next = {
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
        const dup = await db_1.prisma.deliveryZone.findFirst({
            where: { name: next.name, id: { not: id } },
        });
        if (dup) {
            throw new DeliveryError(`A delivery zone named "${next.name}" already exists.`, 409);
        }
    }
    return db_1.prisma.deliveryZone.update({
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
async function deleteDeliveryZone(id) {
    await getDeliveryZone(id);
    await db_1.prisma.deliveryZone.delete({ where: { id } });
    return { deleted: true, id };
}
//# sourceMappingURL=delivery.service.js.map
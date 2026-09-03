"use strict";
// =============================================================================
// Delivery Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListDeliveryZones = handleListDeliveryZones;
exports.handleAdminListDeliveryZones = handleAdminListDeliveryZones;
exports.handleAdminGetDeliveryZone = handleAdminGetDeliveryZone;
exports.handleAdminCreateDeliveryZone = handleAdminCreateDeliveryZone;
exports.handleAdminUpdateDeliveryZone = handleAdminUpdateDeliveryZone;
exports.handleAdminDeleteDeliveryZone = handleAdminDeleteDeliveryZone;
const delivery_service_1 = require("./delivery.service");
const socketService_1 = require("../../services/socketService");
// Fire-and-forget audit trail entry
function track(adminId, action, entityId, details) {
    if (!adminId)
        return;
    (0, socketService_1.logAdminActivity)(adminId, action, "DeliveryZone", entityId, details ?? null).catch(() => { });
}
function handleDeliveryError(err, res) {
    if (err instanceof delivery_service_1.DeliveryError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Delivery error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
}
// ---------------------------------------------------------------------------
// GET /api/delivery-zones — public (active zones only, for checkout + map)
// ---------------------------------------------------------------------------
async function handleListDeliveryZones(_req, res) {
    try {
        const zones = await (0, delivery_service_1.listDeliveryZones)(false);
        res.json({ data: zones });
    }
    catch (err) {
        handleDeliveryError(err, res);
    }
}
// ===========================================================================
// ADMIN — mounted under /api/admin/delivery-zones
// ===========================================================================
async function handleAdminListDeliveryZones(_req, res) {
    try {
        const zones = await (0, delivery_service_1.listDeliveryZones)(true);
        res.json({ data: zones });
    }
    catch (err) {
        handleDeliveryError(err, res);
    }
}
async function handleAdminGetDeliveryZone(req, res) {
    try {
        const zone = await (0, delivery_service_1.getDeliveryZone)(req.params.id);
        res.json({ data: zone });
    }
    catch (err) {
        handleDeliveryError(err, res);
    }
}
async function handleAdminCreateDeliveryZone(req, res) {
    try {
        const body = req.body;
        const zone = await (0, delivery_service_1.createDeliveryZone)({
            name: body.name,
            latitude: Number(body.latitude),
            longitude: Number(body.longitude),
            deliveryCharges: Number(body.deliveryCharges),
            estimatedDays: body.estimatedDays !== undefined ? Number(body.estimatedDays) : undefined,
            active: body.active,
        });
        res.status(201).json({ data: zone, message: "Delivery zone created successfully" });
        track(req.user?.userId, "CREATE_DELIVERY_ZONE", zone.id, { name: zone.name });
    }
    catch (err) {
        handleDeliveryError(err, res);
    }
}
async function handleAdminUpdateDeliveryZone(req, res) {
    try {
        const body = req.body;
        const zone = await (0, delivery_service_1.updateDeliveryZone)(req.params.id, {
            name: body.name,
            latitude: body.latitude !== undefined ? Number(body.latitude) : undefined,
            longitude: body.longitude !== undefined ? Number(body.longitude) : undefined,
            deliveryCharges: body.deliveryCharges !== undefined ? Number(body.deliveryCharges) : undefined,
            estimatedDays: body.estimatedDays !== undefined ? Number(body.estimatedDays) : undefined,
            active: body.active,
        });
        res.json({ data: zone, message: "Delivery zone updated successfully" });
        track(req.user?.userId, "UPDATE_DELIVERY_ZONE", req.params.id, {
            name: zone?.name,
        });
    }
    catch (err) {
        handleDeliveryError(err, res);
    }
}
async function handleAdminDeleteDeliveryZone(req, res) {
    try {
        const result = await (0, delivery_service_1.deleteDeliveryZone)(req.params.id);
        res.json({ ...result, message: "Delivery zone deleted successfully" });
        track(req.user?.userId, "DELETE_DELIVERY_ZONE", result.id);
    }
    catch (err) {
        handleDeliveryError(err, res);
    }
}
//# sourceMappingURL=delivery.controller.js.map
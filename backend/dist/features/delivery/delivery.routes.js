"use strict";
// =============================================================================
// Delivery Feature — Public Route Definitions
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const delivery_controller_1 = require("./delivery.controller");
const router = (0, express_1.Router)();
// GET /api/delivery-zones — public list of active zones (checkout dropdown + map)
router.get("/", delivery_controller_1.handleListDeliveryZones);
exports.default = router;
//# sourceMappingURL=delivery.routes.js.map
"use strict";
// =============================================================================
// Measurements Feature — Route Definitions
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const measurements_controller_1 = require("./measurements.controller");
const router = (0, express_1.Router)();
router.post("/", measurements_controller_1.handleCreateMeasurement);
exports.default = router;
//# sourceMappingURL=measurements.routes.js.map
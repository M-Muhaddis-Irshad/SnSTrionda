"use strict";
// =============================================================================
// Measurements Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateMeasurement = handleCreateMeasurement;
const measurements_service_1 = require("./measurements.service");
// ---------------------------------------------------------------------------
// POST /api/measurements
// ---------------------------------------------------------------------------
async function handleCreateMeasurement(req, res) {
    try {
        const { chest, waist, shoulder, sleeveLength, neck, hip, inseam, thigh, rise, cuff, height, notes, } = req.body;
        const result = await (0, measurements_service_1.createMeasurement)({
            chest, waist, shoulder, sleeveLength, neck,
            hip, inseam, thigh, rise, cuff, height, notes,
        });
        res.status(201).json({
            message: "Measurements saved successfully",
            data: result,
        });
    }
    catch (err) {
        if (err instanceof measurements_service_1.MeasurementError) {
            return res.status(err.statusCode).json({ error: err.message });
        }
        console.error("Create measurement error:", err?.message || err);
        res.status(500).json({ error: "Internal server error" });
    }
}
//# sourceMappingURL=measurements.controller.js.map
// =============================================================================
// Measurements Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import { createMeasurement, MeasurementError } from "./measurements.service";

// ---------------------------------------------------------------------------
// POST /api/measurements
// ---------------------------------------------------------------------------

export async function handleCreateMeasurement(req: Request, res: Response) {
  try {
    const {
      chest, waist, shoulder, sleeveLength, neck,
      hip, inseam, thigh, rise, cuff, height, notes,
    } = req.body;

    const result = await createMeasurement({
      chest, waist, shoulder, sleeveLength, neck,
      hip, inseam, thigh, rise, cuff, height, notes,
    });

    res.status(201).json({
      message: "Measurements saved successfully",
      data: result,
    });
  } catch (err: any) {
    if (err instanceof MeasurementError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Create measurement error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

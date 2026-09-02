"use strict";
// =============================================================================
// Measurements Feature — Business Logic Service
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeasurementError = void 0;
exports.createMeasurement = createMeasurement;
const db_1 = require("../../db");
// All measurement fields (excluding notes)
const MEASUREMENT_FIELDS = [
    "chest", "waist", "shoulder", "sleeveLength", "neck",
    "hip", "inseam", "thigh", "rise", "cuff", "height",
];
// Reasonable range: 0–100 inches
const MIN_VALUE = 0;
const MAX_VALUE = 100;
// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
class MeasurementError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "MeasurementError";
    }
}
exports.MeasurementError = MeasurementError;
function validateMeasurementInput(input) {
    // Check that at least ONE measurement field is provided and non-null
    const hasAtLeastOne = MEASUREMENT_FIELDS.some((field) => {
        const val = input[field];
        return val !== undefined && val !== null && val !== 0;
    });
    if (!hasAtLeastOne) {
        throw new MeasurementError("At least one measurement must be provided. Please fill in at least one field.", 400);
    }
    // Range validation for each provided field
    for (const field of MEASUREMENT_FIELDS) {
        const val = input[field];
        if (val !== undefined && val !== null) {
            if (typeof val !== "number" || isNaN(val)) {
                throw new MeasurementError(`${field} must be a valid number.`, 400);
            }
            if (val < MIN_VALUE) {
                throw new MeasurementError(`${field} cannot be negative.`, 400);
            }
            if (val > MAX_VALUE) {
                throw new MeasurementError(`${field} seems unreasonably large (max 100 inches).`, 400);
            }
        }
    }
}
// ---------------------------------------------------------------------------
// Create Measurement
// ---------------------------------------------------------------------------
async function createMeasurement(input) {
    validateMeasurementInput(input);
    const measurement = await db_1.prisma.customMeasurement.create({
        data: {
            chest: input.chest ?? null,
            waist: input.waist ?? null,
            shoulder: input.shoulder ?? null,
            sleeveLength: input.sleeveLength ?? null,
            neck: input.neck ?? null,
            hip: input.hip ?? null,
            inseam: input.inseam ?? null,
            thigh: input.thigh ?? null,
            rise: input.rise ?? null,
            cuff: input.cuff ?? null,
            height: input.height ?? null,
            notes: input.notes ?? null,
        },
    });
    return measurement;
}
//# sourceMappingURL=measurements.service.js.map
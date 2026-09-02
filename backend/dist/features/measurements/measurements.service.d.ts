export interface CreateMeasurementInput {
    chest?: number | null;
    waist?: number | null;
    shoulder?: number | null;
    sleeveLength?: number | null;
    neck?: number | null;
    hip?: number | null;
    inseam?: number | null;
    thigh?: number | null;
    rise?: number | null;
    cuff?: number | null;
    height?: number | null;
    notes?: string | null;
}
export declare class MeasurementError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export declare function createMeasurement(input: CreateMeasurementInput): Promise<{
    id: string;
    chest: import("@prisma/client-runtime-utils").Decimal | null;
    waist: import("@prisma/client-runtime-utils").Decimal | null;
    shoulder: import("@prisma/client-runtime-utils").Decimal | null;
    sleeveLength: import("@prisma/client-runtime-utils").Decimal | null;
    neck: import("@prisma/client-runtime-utils").Decimal | null;
    hip: import("@prisma/client-runtime-utils").Decimal | null;
    inseam: import("@prisma/client-runtime-utils").Decimal | null;
    thigh: import("@prisma/client-runtime-utils").Decimal | null;
    rise: import("@prisma/client-runtime-utils").Decimal | null;
    cuff: import("@prisma/client-runtime-utils").Decimal | null;
    height: import("@prisma/client-runtime-utils").Decimal | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=measurements.service.d.ts.map
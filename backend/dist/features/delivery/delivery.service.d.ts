export declare class DeliveryError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export interface DeliveryZoneInput {
    name: string;
    latitude: number;
    longitude: number;
    deliveryCharges: number;
    estimatedDays?: number;
    active?: boolean;
}
export declare function validateZoneInput(input: DeliveryZoneInput): void;
export declare function listDeliveryZones(includeInactive?: boolean): Promise<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    deliveryCharges: number;
    estimatedDays: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function getDeliveryZone(id: string): Promise<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    deliveryCharges: number;
    estimatedDays: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function createDeliveryZone(input: DeliveryZoneInput): Promise<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    deliveryCharges: number;
    estimatedDays: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateDeliveryZone(id: string, input: Partial<DeliveryZoneInput>): Promise<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    deliveryCharges: number;
    estimatedDays: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteDeliveryZone(id: string): Promise<{
    deleted: boolean;
    id: string;
}>;
//# sourceMappingURL=delivery.service.d.ts.map
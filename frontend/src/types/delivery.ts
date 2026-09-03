// =============================================================================
// Delivery — shared types
// =============================================================================

export interface DeliveryZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  deliveryCharges: number;
  estimatedDays: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function deliveryDaysLabel(estimatedDays: number): string {
  if (estimatedDays <= 1) return "1 day";
  return `${estimatedDays - 1}–${estimatedDays} days`;
}
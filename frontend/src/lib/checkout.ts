// =============================================================================
// Checkout — shared constants & totals helpers
// =============================================================================

export const SHIPPING_COST = 200;

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

// Discount is a whole-rupee amount (matches the backend calculation exactly).
// `shipping` can be overridden with the selected delivery zone's charges.
export function computeTotals(
  subtotal: number,
  discountPercent: number | null,
  shipping: number = SHIPPING_COST
) {
  const discount =
    discountPercent && discountPercent > 0
      ? Math.round((subtotal * discountPercent) / 100)
      : 0;
  const shippingCost = shipping;
  const total = Math.max(0, subtotal + shippingCost - discount);
  return { subtotal, shipping: shippingCost, discount, total };
}

// Pakistan phone numbers: 03XXXXXXXXX, 3XXXXXXXXX or +92 3XXXXXXXXX
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/[^\d]/g, "");
  if (digits.startsWith("92")) return digits.length === 12;
  return digits.length === 10 || digits.length === 11;
}

// Pakistan postal codes are 5 digits
export function isValidPostalCode(value: string): boolean {
  return /^\d{5}$/.test(value);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

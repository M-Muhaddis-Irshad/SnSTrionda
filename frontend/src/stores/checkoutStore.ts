// =============================================================================
// Checkout Store — promo code state shared between the form and order summary
// =============================================================================

import { create } from "zustand";

interface CheckoutState {
  promoCode: string | null;
  discountPercent: number | null;
}

interface CheckoutActions {
  applyPromo: (code: string, discountPercent: number) => void;
  clearPromo: () => void;
}

export const useCheckoutStore = create<CheckoutState & CheckoutActions>((set) => ({
  promoCode: null,
  discountPercent: null,

  applyPromo: (code, discountPercent) =>
    set({ promoCode: code, discountPercent }),

  clearPromo: () => set({ promoCode: null, discountPercent: null }),
}));

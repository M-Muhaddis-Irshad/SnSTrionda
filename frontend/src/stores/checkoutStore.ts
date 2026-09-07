// =============================================================================
// Checkout Store — promo code state shared between the form and order summary
// =============================================================================

import { create } from "zustand";

// localStorage key used by older versions of the checkout page to persist a
// draft form. Kept here so resetCheckout/clearCheckout can purge stale data
// (e.g. a "phantom" phone number left over from a previous session).
export const CHECKOUT_DRAFT_KEY = "trionda-checkout-draft";

interface CheckoutState {
  promoCode: string | null;
  /** PERCENT coupons — % off the subtotal. */
  discountPercent: number | null;
  /** FLAT coupons — fixed PKR amount off (mutually exclusive with percent). */
  discountAmount: number | null;
}

interface CheckoutActions {
  applyPromo: (code: string, discountPercent: number | null, discountAmount?: number | null) => void;
  clearPromo: () => void;
  /** Reset the whole checkout session — clears promo and any persisted draft. */
  resetCheckout: () => void;
  /** Clear everything after an order is placed. Alias of resetCheckout. */
  clearCheckout: () => void;
}

function clearPersistedDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CHECKOUT_DRAFT_KEY);
  } catch {
    /* storage unavailable */
  }
}

export const useCheckoutStore = create<CheckoutState & CheckoutActions>((set) => ({
  promoCode: null,
  discountPercent: null,
  discountAmount: null,

  applyPromo: (code, discountPercent, discountAmount) =>
    set({
      promoCode: code,
      discountPercent: discountPercent ?? null,
      discountAmount: discountAmount ?? null,
    }),

  clearPromo: () => set({ promoCode: null, discountPercent: null, discountAmount: null }),

  resetCheckout: () => {
    clearPersistedDraft();
    set({ promoCode: null, discountPercent: null, discountAmount: null });
  },

  clearCheckout: () => {
    clearPersistedDraft();
    set({ promoCode: null, discountPercent: null, discountAmount: null });
  },
}));
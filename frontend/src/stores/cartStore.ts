// =============================================================================
// Cart Store — Zustand with localStorage persistence
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  variantLabel: string; // e.g. "Navy / L"
  unitPrice: number;
  quantity: number;
  imageUrl: string;
  customMeasurementId?: string | null;
}

interface CartState {
  items: CartItem[];
}

interface CartActions {
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
}

// ---------------------------------------------------------------------------
// Derived selectors (computed on-demand, not stored in state)
// ---------------------------------------------------------------------------

export function selectTotalItems(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function selectSubtotal(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          );

          if (existing) {
            // Merge quantity — don't create duplicate line
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                  : i
              ),
            };
          }

          // New item
          return {
            items: [
              ...state.items,
              { ...item, quantity: item.quantity || 1 },
            ],
          };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        })),

      updateQuantity: (productId, variantId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            // Remove item if quantity drops to 0 or below
            return {
              items: state.items.filter(
                (i) => !(i.productId === productId && i.variantId === variantId)
              ),
            };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId && i.variantId === variantId
                ? { ...i, quantity }
                : i
            ),
          };
        }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "trionda-cart", // localStorage key
    }
  )
);

// =============================================================================
// Wishlist Store — Zustand with backend sync for logged-in users
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface WishlistState {
  /** Local product IDs — always kept in sync with the backend when logged in. */
  items: string[];
  /** Whether the remote wishlist has been fetched at least once this session. */
  hydrated: boolean;
  /** Whether the login modal should be shown. */
  showLoginModal: boolean;

  /** Toggle a product. If logged in, syncs with backend. */
  toggle: (productId: string, authed: boolean, token?: string | null) => void;
  /** Check if a product is wishlisted. */
  has: (productId: string) => boolean;
  /** Sync local items with backend (call on login). */
  fetchFromBackend: (token: string) => Promise<void>;
  /** Clear everything (on logout). */
  clear: () => void;
  /** Show / hide login modal. */
  setShowLoginModal: (v: boolean) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      showLoginModal: false,

      toggle: async (productId, authed, token) => {
        if (!authed || !token) {
          // Guest — just toggle locally and show login modal
          const exists = get().items.includes(productId);
          if (exists) {
            set({ items: get().items.filter((id) => id !== productId) });
          } else {
            set({ items: [...get().items, productId], showLoginModal: true });
          }
          return;
        }

        // Logged in — call backend toggle
        try {
          const res = await fetch(`${API_URL}/api/wishlist/toggle`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ productId }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.wishlisted) {
              if (!get().items.includes(productId)) {
                set({ items: [...get().items, productId] });
              }
            } else {
              set({ items: get().items.filter((id) => id !== productId) });
            }
          }
        } catch {
          // On network error, fall back to local toggle
          const exists = get().items.includes(productId);
          set({
            items: exists
              ? get().items.filter((id) => id !== productId)
              : [...get().items, productId],
          });
        }
      },

      has: (productId) => get().items.includes(productId),

      fetchFromBackend: async (token) => {
        try {
          const res = await fetch(`${API_URL}/api/wishlist`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            const ids = (data.data || []).map((item: any) => item.productId);
            set({ items: ids, hydrated: true });
          }
        } catch {
          set({ hydrated: true });
        }
      },

      clear: () => set({ items: [], hydrated: false }),

      setShowLoginModal: (v) => set({ showLoginModal: v }),
    }),
    { name: "trionda-wishlist" }
  )
);

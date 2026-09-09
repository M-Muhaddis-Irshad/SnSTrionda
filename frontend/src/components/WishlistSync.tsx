"use client";

import { useEffect } from "react";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useAuthStore } from "@/stores/authStore";

/**
 * Fetches the user's wishlist from the backend whenever they're logged in.
 * Mount this once in the root layout — it syncs on auth state changes.
 */
export default function WishlistSync() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const fetchFromBackend = useWishlistStore((s) => s.fetchFromBackend);
  const clear = useWishlistStore((s) => s.clear);

  useEffect(() => {
    if (accessToken && user) {
      fetchFromBackend(accessToken);
    } else {
      // Logged out — keep localStorage items but clear hydrated flag
      clear();
    }
  }, [accessToken, user, fetchFromBackend, clear]);

  return null;
}

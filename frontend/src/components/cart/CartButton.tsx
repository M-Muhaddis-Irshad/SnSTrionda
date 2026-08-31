"use client";

import { useState, useEffect } from "react";
import { useCartStore, selectTotalItems } from "@/stores/cartStore";
import CartDrawer from "./CartDrawer";

// ---------------------------------------------------------------------------
// CartButton Component
// ---------------------------------------------------------------------------
// Isolated client sub-component so Header stays a Server Component.
// Handles: cart icon click → open drawer, badge count from Zustand store.

export default function CartButton() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const totalItems = useCartStore(selectTotalItems);

  // Listen for custom event from mobile bottom nav cart tab
  useEffect(() => {
    const handleOpenCart = () => setIsDrawerOpen(true);
    window.addEventListener("trionda:open-cart", handleOpenCart);
    return () => window.removeEventListener("trionda:open-cart", handleOpenCart);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center text-muted transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Cart${totalItems > 0 ? ` (${totalItems} items)` : ""}`}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>

        {/* Badge — small circle with count */}
        {totalItems > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-chrome-200 px-1 font-body text-[10px] font-medium text-background">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>

      <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useCartStore, selectTotalItems } from "@/stores/cartStore";
import CartDrawer from "./CartDrawer";

export default function CartButton() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const totalItems = useCartStore(selectTotalItems);

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
        className="header-icon-btn relative"
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

        {totalItems > 0 && (
          <span className="cart-badge">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>

      <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}

"use client";

import { useState } from "react";
import { useCartStore, selectSubtotal } from "@/stores/cartStore";
import Badge from "@/components/ui/Badge";
import QuantitySelector from "@/components/products/QuantitySelector";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHIPPING_COST = 200;

// ---------------------------------------------------------------------------
// Format price
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

// ---------------------------------------------------------------------------
// OrderSummaryPanel Component
// ---------------------------------------------------------------------------

export default function OrderSummaryPanel() {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore(selectSubtotal);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const [isOpen, setIsOpen] = useState(false);

  const total = subtotal + SHIPPING_COST;

  return (
    <>
      {/* ── Mobile: Accordion toggle ── */}
      <div className="lg:hidden border border-chrome-500 mb-6">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 font-body text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="flex items-center gap-2">
            Order summary
            <Badge variant="default">{items.length}</Badge>
          </span>
          <span className="font-body text-sm font-medium">{formatPrice(total)}</span>
        </button>

        {isOpen && (
          <div className="border-t border-chrome-500 px-4 py-4 space-y-3">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex items-center gap-3"
              >
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden border border-chrome-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-chrome-500 text-[10px] font-body text-foreground border border-chrome-400">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs text-foreground truncate">
                    {item.productName}
                  </p>
                  <p className="font-body text-[11px] text-muted">
                    {item.variantLabel}
                  </p>
                  <div className="mt-1">
                    <QuantitySelector
                      value={item.quantity}
                      onChange={(q) => updateQuantity(item.productId, item.variantId, q)}
                      min={1}
                      max={99}
                    />
                  </div>
                </div>
                <span className="font-body text-xs text-foreground ml-auto">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop: Sticky summary ── */}
      <div className="hidden lg:block sticky top-8">
        <div className="border border-chrome-500 p-6">
          <h2 className="font-display text-lg tracking-wider text-foreground mb-6">
            Order summary
          </h2>

          {/* Cart items */}
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex items-center gap-3"
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden border border-chrome-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-foreground truncate">
                    {item.productName}
                  </p>
                  <p className="font-body text-xs text-muted">
                    {item.variantLabel}
                  </p>
                  <div className="mt-2">
                    <QuantitySelector
                      value={item.quantity}
                      onChange={(q) => updateQuantity(item.productId, item.variantId, q)}
                      min={1}
                      max={99}
                    />
                  </div>
                </div>
                <span className="font-body text-sm text-foreground ml-auto">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-chrome-500 pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-body text-sm text-muted">Subtotal</span>
              <span className="font-body text-sm text-foreground">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-body text-sm text-muted">Shipping</span>
              <span className="font-body text-sm text-foreground">
                {formatPrice(SHIPPING_COST)}
              </span>
            </div>
            <div className="flex justify-between pt-3 mt-1 border-t border-chrome-500">
              <span className="font-body text-sm text-foreground font-medium">Total</span>
              <span className="font-display text-xl tracking-wide text-foreground">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

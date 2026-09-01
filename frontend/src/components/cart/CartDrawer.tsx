"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore, selectSubtotal } from "@/stores/cartStore";
import QuantitySelector from "@/components/products/QuantitySelector";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Format price in PKR
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

// ---------------------------------------------------------------------------
// CartDrawer Component
// ---------------------------------------------------------------------------

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore(selectSubtotal);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface border-l border-chrome-500 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-chrome-500 px-6 py-4">
            <h2 className="font-display text-lg tracking-wider text-foreground">
              Your Cart
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Close cart"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg className="h-12 w-12 text-chrome-400 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="font-body text-sm text-muted">Your cart is empty</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 font-body text-sm tracking-wider text-muted underline transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="flex gap-4"
                  >
                    {/* Image */}
                    <div className="h-20 w-16 flex-shrink-0 overflow-hidden border border-chrome-500">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className="h-full w-full"
                          style={{ background: "linear-gradient(135deg, #1a1a1a, #0d0d0d)" }}
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/products/${item.productSlug}`}
                            className="font-body text-sm text-foreground hover:text-chrome-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                            onClick={onClose}
                          >
                            {item.productName}
                          </Link>
                          <p className="font-body text-xs text-muted mt-0.5">
                            {item.variantLabel}
                          </p>
                          {item.customMeasurementId && (
                            <p className="font-body text-xs text-muted mt-0.5">
                              ✓ Custom measurements saved
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Quantity + Price */}
                      <div className="mt-2 flex items-center justify-between">
                        <QuantitySelector
                          value={item.quantity}
                          onChange={(q) => updateQuantity(item.productId, item.variantId, q)}
                          min={1}
                          max={99}
                        />
                        <p className="font-body text-sm text-foreground">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer — subtotal + checkout */}
          {items.length > 0 && (
            <div className="border-t border-chrome-500 px-6 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-muted">Subtotal</span>
                <span className="font-display text-lg tracking-wide text-foreground">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="font-body text-xs text-muted">
                Shipping calculated at checkout
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/checkout");
                }}
                className="block w-full text-center font-body text-sm tracking-[0.2em] uppercase border border-chrome-400 bg-transparent text-foreground px-10 py-4 transition-all duration-300 hover:border-chrome-200 hover:bg-chrome-500 hover:text-chrome-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

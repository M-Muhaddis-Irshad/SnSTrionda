"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
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
          className="cart-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        className={`cart-panel ${
          isOpen ? "cart-panel--open" : "cart-panel--closed"
        }`}
      >
        <div className="cart-panel-inner">
          {/* Header */}
          <div className="cart-header">
            <h2 className="cart-title">
              Your Cart
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="cart-close-btn"
              aria-label="Close cart"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Items */}
          <div className="cart-items-area">
            {items.length === 0 ? (
              <div className="cart-empty">
                <svg className="h-12 w-12 text-chrome-400 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="cart-empty-text">Your cart is empty</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="cart-empty-continue"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="cart-items-list">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="cart-item"
                  >
                    {/* Image */}
                    <div className="cart-item-image-wrap">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="cart-item-image"
                        />
                      ) : (
                        <div className="cart-item-image-placeholder" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="cart-item-details">
                      <div className="cart-item-header">
                        <div>
                          <Link
                            href={`/products/${item.productSlug}`}
                            className="cart-item-name"
                            onClick={onClose}
                          >
                            {item.productName}
                          </Link>
                          <p className="cart-item-variant">
                            {item.variantLabel}
                          </p>
                          {item.customMeasurementId && (
                            <p className="cart-item-measurement flex items-center gap-1">
                              <Check size={12} strokeWidth={2} className="text-chrome-200" aria-hidden="true" />
                              Custom measurements saved
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="cart-item-remove-btn"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Quantity + Price */}
                      <div className="cart-item-footer">
                        <QuantitySelector
                          value={item.quantity}
                          onChange={(q) => updateQuantity(item.productId, item.variantId, q)}
                          min={1}
                          max={99}
                        />
                        <p className="cart-item-price">
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
            <div className="cart-footer">
              <div className="cart-subtotal-row">
                <span className="cart-subtotal-label">Subtotal</span>
                <span className="cart-subtotal-value">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="cart-shipping-note">
                Shipping calculated at checkout
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/checkout");
                }}
                className="cart-checkout-btn"
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

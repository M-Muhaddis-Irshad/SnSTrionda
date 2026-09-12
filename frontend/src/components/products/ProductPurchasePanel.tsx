"use client";

// =============================================================================
// ProductPurchasePanel — price, real rating, variant selection with stock
// states, quantity, Add to Cart / Buy Now, wishlist, made-to-order note.
// =============================================================================

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QuantitySelector from "./QuantitySelector";
import MeasurementForm from "./MeasurementForm";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useAuthStore } from "@/stores/authStore";
import LoginModal from "@/components/ui/LoginModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PurchaseVariant {
  id: string;
  size: string | null;
  color: string | null;
  fabricType: string | null;
  sku: string;
  price: number | null;
  stockQuantity: number;
}

export interface PurchaseImage {
  id: string;
  url: string;
  altText: string | null;
  displayOrder: number;
}

interface ProductPurchasePanelProps {
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  basePrice: number;
  discountedPrice?: number | null;
  isCustomizable: boolean;
  variants: PurchaseVariant[];
  images: PurchaseImage[];
  apiUrl: string;
  rating: number | null;
  reviewCount: number;
}

// ---------------------------------------------------------------------------
// Stars (real rating, rounded to nearest half shown as full/empty)
// ---------------------------------------------------------------------------

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={star <= Math.round(rating) ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1"
          aria-hidden="true"
          className="text-foreground"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
          />
        </svg>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProductPurchasePanel({
  productId,
  productName,
  productSlug,
  categoryName,
  basePrice,
  discountedPrice,
  isCustomizable,
  variants,
  images,
  apiUrl,
  rating,
  reviewCount,
}: ProductPurchasePanelProps) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => s.items.includes(productId));
  const showLoginModal = useWishlistStore((s) => s.showLoginModal);
  const setShowLoginModal = useWishlistStore((s) => s.setShowLoginModal);
  const authed = useAuthStore((s) => s.isAuthenticated());
  const token = useAuthStore((s) => s.accessToken);
  const [loginModalMsg, setLoginModalMsg] = useState("Sign in to continue.");

  // Unique options
  const sizes = useMemo(
    () => [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[],
    [variants]
  );
  const colors = useMemo(
    () => [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[],
    [variants]
  );

  // A size/color option is selectable if at least one matching variant has stock
  // (made-to-order products skip stock gating — all options are always available)
  const sizeAvailable = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const size of sizes) {
      map.set(
        size,
        isCustomizable || variants.some((v) => v.size === size && v.stockQuantity > 0)
      );
    }
    return map;
  }, [sizes, variants, isCustomizable]);

  const colorAvailable = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const color of colors) {
      map.set(
        color,
        isCustomizable || variants.some((v) => v.color === color && v.stockQuantity > 0)
      );
    }
    return map;
  }, [colors, variants, isCustomizable]);

  // Matched variant (size + color; either dimension optional)
  const matchedVariant = useMemo(
    () =>
      variants.find((v) => {
        const sizeMatch = selectedSize ? v.size === selectedSize : true;
        const colorMatch = selectedColor ? v.color === selectedColor : true;
        return sizeMatch && colorMatch;
      }) || null,
    [variants, selectedSize, selectedColor]
  );

  const hasSelectableOptions = sizes.length > 0 || colors.length > 0;
  const variantToAdd = hasSelectableOptions
    ? matchedVariant
    : variants.length > 0
    ? variants[0]
    : null;

  // Admin-managed sale (discounts feature) takes precedence;
  // otherwise a variant priced below the base price counts as the item's own sale.
  const hasAdminSale =
    discountedPrice != null && discountedPrice < basePrice;
  const hasVariantSale =
    matchedVariant?.price != null && matchedVariant.price !== basePrice;
  const hasSale = hasAdminSale || hasVariantSale;
  const displayPrice = hasAdminSale
    ? discountedPrice!
    : matchedVariant?.price ?? basePrice;
  const stock = variantToAdd?.stockQuantity ?? 0;
  // Made-to-order products are never stock-gated; zero-variant products
  // show as "no variant selected" rather than "sold out".
  const isSoldOut =
    !isCustomizable &&
    variantToAdd !== null &&
    stock <= 0;
  const lowStock = !isCustomizable && !isSoldOut && stock > 0 && stock <= 5;

  const canAddToCart = variantToAdd !== null && !isSoldOut;

  function buildVariantLabel(): string {
    const parts = [selectedColor, selectedSize].filter(Boolean);
    return parts.length > 0 ? parts.join(" / ") : variantToAdd?.sku || productName;
  }

  function handleAddToCart(navigateToCheckout: boolean) {
    if (!canAddToCart || !variantToAdd) return;
    if (!authed) {
      setLoginModalMsg(
        navigateToCheckout
          ? "Sign in to buy this product."
          : "Sign in to add items to your cart."
      );
      setShowLoginModal(true);
      return;
    }
    // Use the live discounted price when available (backend-computed from
    // active Discount records).  Fall back to the variant's own price, then
    // to the base price.
    const effectivePrice =
      discountedPrice != null && discountedPrice < basePrice
        ? discountedPrice
        : variantToAdd.price ?? basePrice;
    addItem({
      productId,
      variantId: variantToAdd.id,
      productName,
      productSlug,
      variantLabel: buildVariantLabel(),
      unitPrice: effectivePrice,
      quantity,
      imageUrl: images[0]?.url || "",
      customMeasurementId: null,
    });
    setQuantity(1);
    if (navigateToCheckout) router.push("/checkout");
  }

  return (
    <div>
      {/* Category */}
      <p className="font-body text-xs uppercase tracking-[0.25em] text-muted">
        {categoryName}
      </p>

      {/* Title */}
      <h1 className="mt-3 font-display text-3xl tracking-wide text-foreground sm:text-4xl">
        {productName}
      </h1>

      {/* Rating — real approved-review average */}
      {rating !== null && (
        <div className="mt-4 flex items-center gap-3">
          <Stars rating={rating} />
          <span className="font-body text-sm text-muted">
            {rating.toFixed(1)} · {reviewCount} review{reviewCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Price */}
      <div className="mt-5 flex items-baseline gap-3">
        {hasSale && (
          <p className="font-body text-sm text-muted line-through">
            Rs. {basePrice.toLocaleString("en-PK")}
          </p>
        )}
        <p className="font-display text-2xl tracking-wide text-foreground">
          Rs. {displayPrice.toLocaleString("en-PK")}
        </p>
      </div>

      {/* Size buttons */}
      {sizes.length > 0 && (
        <div className="mt-8">
          <h3 className="font-body text-sm uppercase tracking-[0.25em] text-foreground">
            Size
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((size) => {
              const available = sizeAvailable.get(size) ?? true;
              const active = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={!available}
                  onClick={() => setSelectedSize(active ? null : size)}
                  className={`min-w-12 border px-4 py-2.5 font-body text-sm tracking-wider transition-colors ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : available
                      ? "border-chrome-500 text-muted hover:border-chrome-300 hover:text-foreground"
                      : "cursor-not-allowed border-chrome-500/40 text-chrome-400/50 line-through"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color swatches */}
      {colors.length > 0 && (
        <div className="mt-7">
          <h3 className="font-body text-sm uppercase tracking-[0.25em] text-foreground">
            Color
          </h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map((color) => {
              const available = colorAvailable.get(color) ?? true;
              const active = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  disabled={!available}
                  onClick={() => setSelectedColor(active ? null : color)}
                  title={`${color}${available ? "" : " (sold out)"}`}
                  aria-label={`${color}${available ? "" : " — sold out"}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    active
                      ? "border-foreground ring-1 ring-foreground ring-offset-2 ring-offset-background"
                      : "border-chrome-500 hover:border-chrome-300"
                  } ${available ? "" : "opacity-30"}`}
                  style={{ backgroundColor: color.toLowerCase() }}
                >
                  {active && (
                    <span className="text-[10px] text-white mix-blend-difference">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection feedback */}
      {hasSelectableOptions && (
        <p className="mt-4 font-body text-xs text-muted">
          {variantToAdd
            ? `Selected: ${buildVariantLabel()}`
            : "Select a size and/or color above"}
        </p>
      )}

      {/* Stock state — real stock values */}
      {variantToAdd && isSoldOut && (
        <p className="mt-3 font-body text-sm text-red-400">Sold out</p>
      )}
      {lowStock && (
        <p className="mt-3 font-body text-sm text-amber-400">
          Only {stock} left in stock
        </p>
      )}

      {/* Made to order */}
      {isCustomizable && (
        <div className="mt-8 border border-chrome-500 p-4">
          <p className="font-body text-xs uppercase tracking-[0.25em] text-foreground">
            Made to Order
          </p>
          <p className="mt-2 font-body text-sm text-muted">
            This piece is custom-made. Provide your measurements for a perfect fit.
          </p>
          <div className="mt-4">
            <MeasurementForm apiUrl={apiUrl} />
          </div>
        </div>
      )}

      {/* Quantity + actions */}
      <div className="mt-8 flex items-center gap-4">
        <span className="font-body text-sm uppercase tracking-[0.25em] text-muted">
          Qty
        </span>
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={variantToAdd ? Math.min(Math.max(stock, 1), 99) : 99}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={!canAddToCart}
          onClick={() => handleAddToCart(false)}
          className={`flex-1 border py-3.5 font-body text-sm uppercase tracking-[0.2em] transition-colors ${
            canAddToCart
              ? "border-chrome-300 text-foreground hover:bg-foreground hover:text-background"
              : "cursor-not-allowed border-chrome-500/50 text-chrome-400/60"
          }`}
        >
          {!canAddToCart && hasSelectableOptions
            ? isSoldOut
              ? "Sold Out"
              : "Select a Variant"
            : "Add to Cart"}
        </button>
        <button
          type="button"
          disabled={!canAddToCart}
          onClick={() => handleAddToCart(true)}
          className={`flex-1 py-3.5 font-body text-sm uppercase tracking-[0.2em] transition-colors ${
            canAddToCart
              ? "bg-foreground text-background hover:bg-chrome-200"
              : "cursor-not-allowed bg-chrome-500/40 text-chrome-400/60"
          }`}
        >
          Buy Now
        </button>
      </div>

      {/* Wishlist */}
      <button
        type="button"
        onClick={() => toggleWishlist(productId, authed, token)}
        className="mt-5 inline-flex items-center gap-2 font-body text-xs uppercase tracking-[0.2em] text-muted underline underline-offset-4 transition-colors hover:text-foreground"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={isWished ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {isWished ? "In Wishlist" : "Add to Wishlist"}
      </button>

      {/* Meta */}
      <dl className="mt-8 space-y-2 border-t border-chrome-500/70 pt-6 font-body text-sm">
        {variantToAdd?.sku && (
          <div className="flex justify-between">
            <dt className="text-muted">SKU</dt>
            <dd className="text-foreground">{variantToAdd.sku}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">Category</dt>
          <dd className="text-foreground">{categoryName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Availability</dt>
          <dd className="text-foreground">
            {isSoldOut ? "Sold out" : lowStock ? `${stock} in stock` : "In stock"}
          </dd>
        </div>
      </dl>
    <LoginModal
      open={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      message={loginModalMsg}
    />
    </div>
  );
}
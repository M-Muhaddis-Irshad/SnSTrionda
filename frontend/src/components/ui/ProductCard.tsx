"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useAuthStore } from "@/stores/authStore";
import LoginModal from "@/components/ui/LoginModal";
import CategoryBadge from "@/components/CategoryBadge";
import { useMounted } from "@/lib/useMounted";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  displayOrder: number;
}

interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  price: number | null;
  stockQuantity: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  isCustomizable?: boolean;
  category: { id: string; name: string; slug: string };
  images: ProductImage[];
  variants: ProductVariant[];
  /** Admin-managed sale (from the discounts feature) — present when live. */
  discount?: {
    id: string;
    name: string;
    type: "PERCENT" | "FLAT";
    value: number;
  } | null;
  /** Computed sale price on the base price (null = not on admin sale). */
  discountedPrice?: number | null;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "#F2F2F2" : "none"}
      stroke="#F2F2F2"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Badge component
// ---------------------------------------------------------------------------

function Badge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "sale" | "new";
}) {
  return (
    <span className={`product-card-badge product-card-badge--${variant}`}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Price display
// ---------------------------------------------------------------------------

function PriceDisplay({
  basePrice,
  variants,
  discountedPrice,
}: {
  basePrice: number;
  variants: ProductVariant[];
  discountedPrice?: number | null;
}) {
  const variantPrices = variants
    .map((v) => v.price)
    .filter((p): p is number => p !== null);

  // Admin-managed sale takes precedence; otherwise a variant priced below the
  // base price counts as the item's own sale (existing behavior).
  const adminSale =
    discountedPrice !== undefined && discountedPrice !== null && discountedPrice < basePrice;
  const variantSale =
    variantPrices.length > 0 && variantPrices.some((p) => p < basePrice);
  const lowestVariantPrice = variantSale ? Math.min(...variantPrices) : null;

  const showOriginal = adminSale || (variantSale && lowestVariantPrice !== null);
  const currentPrice = adminSale
    ? discountedPrice!
    : variantSale && lowestVariantPrice !== null
      ? lowestVariantPrice
      : basePrice;

  return (
    <div className="product-card-price">
      {showOriginal && (
        <span className="product-card-price-original">
          Rs. {basePrice.toLocaleString("en-PK")}
        </span>
      )}
      <span className="product-card-price-current">
        Rs. {currentPrice.toLocaleString("en-PK")}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ProductCard
// ---------------------------------------------------------------------------

export default function ProductCard({
  product,
  layout = "grid",
  showCategoryBadge = false,
  showViewCta = false,
}: {
  product: Product;
  layout?: "grid" | "rail";
  /** Show the category chip above the product name (homepage grid). */
  showCategoryBadge?: boolean;
  /** Show a "View" affordance under the price (homepage grid). */
  showViewCta?: boolean;
}) {
  const mounted = useMounted();
  const [imgError, setImgError] = useState(false);
  const toggle = useWishlistStore((s) => s.toggle);
  const wishlistItems = useWishlistStore((s) => s.items);
  const showLoginModal = useWishlistStore((s) => s.showLoginModal);
  const setShowLoginModal = useWishlistStore((s) => s.setShowLoginModal);
  const isWished = mounted && wishlistItems.includes(product.id);

  const authed = useAuthStore((s) => s.isAuthenticated());
  const token = useAuthStore((s) => s.accessToken);

  const handleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggle(product.id, authed, token);
    },
    [toggle, product.id, authed, token]
  );

  const primaryImage = product.images[0];
  const imgSrc = primaryImage?.url || "";
  const imgAlt = primaryImage?.altText || product.name;

  // Made-to-order products are never stock-gated; zero-variant products
  // show as "not yet configured" rather than "sold out" ([].every === true).
  const isSoldOut =
    !product.isCustomizable &&
    product.variants.length > 0 &&
    product.variants.every((v) => v.stockQuantity <= 0);
  const isNew = false;

  // Admin-managed sale (discounts feature)
  const adminOnSale =
    product.discountedPrice !== undefined &&
    product.discountedPrice !== null &&
    product.discountedPrice < product.basePrice;

  const categoryText = product.category.name.toUpperCase();
  const variantInfo = product.variants.find((v) => v.size || v.color);
  const subText = [categoryText, variantInfo?.size, variantInfo?.color]
    .filter(Boolean)
    .join(" / ");

  // Determine badge
  let badge: { label: string; variant: "default" | "sale" | "new" } | null = null;
  const variantPrices = product.variants.map((v) => v.price).filter((p): p is number => p !== null);
  const hasSale = variantPrices.length > 0 && variantPrices.some((p) => p < product.basePrice);

  if (isSoldOut) {
    badge = { label: "Sold Out", variant: "default" };
  } else if (adminOnSale || hasSale) {
    badge = { label: "Sale", variant: "sale" };
  } else if (isNew) {
    badge = { label: "New", variant: "new" };
  }

  return (
    <>
    <Link
      href={`/products/${product.slug}`}
      className={`product-card product-card--${layout}`}
    >
      <div className="product-card-inner">
        {/* Image area */}
        <div className="product-card-image-area">
          {imgSrc && !imgError ? (
            <img
              src={imgSrc}
              alt={imgAlt}
              loading="lazy"
              onError={() => setImgError(true)}
              className="product-card-img"
            />
          ) : (
            <div className="product-card-placeholder" />
          )}

          {/* Dark gradient overlay */}
          <div className="product-card-gradient" />

          {/* Badge */}
          {badge && (
            <div className="product-card-badge-wrap">
              <Badge label={badge.label} variant={badge.variant} />
            </div>
          )}

          {/* Sold out overlay */}
          {isSoldOut && (
            <div className="product-card-soldout-overlay">
              <span className="product-card-soldout-text">Sold Out</span>
            </div>
          )}

          {/* Wishlist heart */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
            className="product-card-wishlist-btn"
          >
            <HeartIcon filled={isWished} />
          </button>

          {/* Chrome accent line on hover */}
          <div className="product-card-hover-line" />
        </div>

        {/* Content */}
        <div className="product-card-content">
          {showCategoryBadge && <CategoryBadge label={categoryText} />}
          <h3 className="product-card-name">
            {product.name}
          </h3>
          {subText && !showCategoryBadge && (
            <p className="product-card-subtext">
              {subText}
            </p>
          )}
          <div>
            <PriceDisplay
              basePrice={product.basePrice}
              variants={product.variants}
              discountedPrice={product.discountedPrice}
            />
          </div>
          {showViewCta && (
            <span className="product-card-view">
              View
              <svg
                className="product-card-view-arrow"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </span>
          )}
        </div>
      </div>
    </Link>
    <LoginModal
      open={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      message="Sign in to save items to your wishlist."
    />
    </>
  );
}

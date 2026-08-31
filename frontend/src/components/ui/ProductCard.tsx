"use client";

import { useState, useCallback } from "react";
import { useWishlistStore } from "@/stores/wishlistStore";

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
  category: { id: string; name: string; slug: string };
  images: ProductImage[];
  variants: ProductVariant[];
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
  const bg =
    variant === "sale"
      ? "bg-foreground/90"
      : variant === "new"
        ? "bg-foreground/90"
        : "bg-foreground/80";

  return (
    <span
      className={`${bg} px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.15em] text-background`}
    >
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
}: {
  basePrice: number;
  variants: ProductVariant[];
}) {
  const variantPrices = variants
    .map((v) => v.price)
    .filter((p): p is number => p !== null);

  const hasSale = variantPrices.length > 0 && variantPrices.some((p) => p < basePrice);
  const lowestPrice = hasSale ? Math.min(...variantPrices) : null;

  return (
    <div className="flex items-baseline gap-2">
      {hasSale && lowestPrice !== null && (
        <span className="font-body text-sm text-muted line-through">
          Rs. {basePrice.toLocaleString("en-PK")}
        </span>
      )}
      <span className="font-body text-sm font-medium text-foreground">
        Rs. {(hasSale && lowestPrice !== null ? lowestPrice : basePrice).toLocaleString("en-PK")}
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
}: {
  product: Product;
  layout?: "grid" | "rail";
}) {
  const [imgError, setImgError] = useState(false);
  const toggle = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => s.items.includes(product.id));

  const handleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggle(product.id);
    },
    [toggle, product.id]
  );

  const primaryImage = product.images[0];
  const imgSrc = primaryImage?.url || "";
  const imgAlt = primaryImage?.altText || product.name;

  const isSoldOut = product.variants.every((v) => v.stockQuantity <= 0);
  const isNew = false; // No "new" flag in DB — set to true when a "new" field is added

  const categoryText = product.category.name.toUpperCase();
  const variantInfo = product.variants.find(
    (v) => v.size || v.color
  );
  const subText = [categoryText, variantInfo?.size, variantInfo?.color]
    .filter(Boolean)
    .join(" / ");

  // Determine badge
  let badge: { label: string; variant: "default" | "sale" | "new" } | null = null;
  const variantPrices = product.variants.map((v) => v.price).filter((p): p is number => p !== null);
  const hasSale = variantPrices.length > 0 && variantPrices.some((p) => p < product.basePrice);

  if (isSoldOut) {
    badge = { label: "Sold Out", variant: "default" };
  } else if (hasSale) {
    badge = { label: "Sale", variant: "sale" };
  } else if (isNew) {
    badge = { label: "New", variant: "new" };
  }

  const widthClass = layout === "rail" ? "w-56 sm:w-64 flex-shrink-0" : "w-full";

  return (
    <a
      href={`/products/${product.slug}`}
      className={`group block ${widthClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
    >
      <div className="relative overflow-hidden border border-chrome-500 bg-background transition-all duration-300 hover:border-chrome-300">
        {/* Image area — aspect ratio 3/4 */}
        <div className="relative aspect-[3/4] overflow-hidden bg-surface">
          {imgSrc && !imgError ? (
            <img
              src={imgSrc}
              alt={imgAlt}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)",
              }}
            />
          )}

          {/* Dark gradient overlay — always present for moody aesthetic */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 40%, transparent 60%)",
            }}
          />

          {/* Badge — top left */}
          {badge && (
            <div className="absolute top-3 left-3 z-10">
              <Badge label={badge.label} variant={badge.variant} />
            </div>
          )}

          {/* Sold out overlay text */}
          {isSoldOut && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <span className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-foreground/70">
                Sold Out
              </span>
            </div>
          )}

          {/* Wishlist heart — always visible, top right */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/60 backdrop-blur-sm transition-all duration-200 hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300"
          >
            <HeartIcon filled={isWished} />
          </button>

          {/* Chrome accent line on hover */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-chrome-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* Content */}
        <div className="px-3 pb-3 pt-3">
          <h3 className="font-body text-sm font-medium text-foreground leading-snug group-hover:text-chrome-200 transition-colors duration-200">
            {product.name}
          </h3>
          {subText && (
            <p className="mt-1 font-body text-[11px] uppercase tracking-[0.12em] text-muted">
              {subText}
            </p>
          )}
          <div className="mt-2">
            <PriceDisplay basePrice={product.basePrice} variants={product.variants} />
          </div>
        </div>
      </div>
    </a>
  );
}

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
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
    <div className="product-card-price">
      {hasSale && lowestPrice !== null && (
        <span className="product-card-price-original">
          Rs. {basePrice.toLocaleString("en-PK")}
        </span>
      )}
      <span className="product-card-price-current">
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
  const isNew = false;

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
  } else if (hasSale) {
    badge = { label: "Sale", variant: "sale" };
  } else if (isNew) {
    badge = { label: "New", variant: "new" };
  }

  return (
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
          <h3 className="product-card-name">
            {product.name}
          </h3>
          {subText && (
            <p className="product-card-subtext">
              {subText}
            </p>
          )}
          <div>
            <PriceDisplay basePrice={product.basePrice} variants={product.variants} />
          </div>
        </div>
      </div>
    </Link>
  );
}

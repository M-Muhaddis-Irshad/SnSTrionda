"use client";

import { useState, useMemo } from "react";
import VariantSelector from "./VariantSelector";
import MeasurementForm from "./MeasurementForm";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useCartStore } from "@/stores/cartStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  fabricType: string | null;
  sku: string;
  price: number | null;
  stockQuantity: number;
}

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  displayOrder: number;
}

interface ProductActionsProps {
  productId: string;
  productName: string;
  productSlug: string;
  basePrice: number;
  isCustomizable: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  apiUrl: string;
}

// ---------------------------------------------------------------------------
// Format price in PKR
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

// ---------------------------------------------------------------------------
// Build variant label
// ---------------------------------------------------------------------------

function buildVariantLabel(variant: ProductVariant): string {
  const parts = [variant.color, variant.size].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : variant.sku;
}

// ---------------------------------------------------------------------------
// ProductActions Component
// ---------------------------------------------------------------------------

export default function ProductActions({
  productId,
  productName,
  productSlug,
  basePrice,
  isCustomizable,
  variants,
  images,
  apiUrl,
}: ProductActionsProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  // Display price: variant override or base price
  const displayPrice = selectedVariant?.price ?? basePrice;

  // Check if all variants have the same price as base (no overrides)
  const hasPriceOverrides = useMemo(
    () => variants.some((v) => v.price !== null && v.price !== basePrice),
    [variants, basePrice]
  );

  // Is there a selectable variant? (product has variants with size/color)
  const hasSelectableVariants = variants.some((v) => v.size || v.color);

  // Determine the variant to add:
  // If product has selectable variants, require one to be selected
  // If no selectable variants, use the first (or only) variant
  const variantToAdd = hasSelectableVariants
    ? selectedVariant
    : variants.length > 0
    ? variants[0]
    : null;

  const canAddToCart = variantToAdd !== null;

  function handleAddToCart() {
    if (!variantToAdd) return;

    // Get primary image URL
    const imageUrl = images.length > 0 ? images[0].url : "";

    addItem({
      productId,
      variantId: variantToAdd.id,
      productName,
      productSlug,
      variantLabel: buildVariantLabel(variantToAdd),
      unitPrice: variantToAdd.price ?? basePrice,
      imageUrl,
      customMeasurementId: null, // TODO: connect to MeasurementForm state when measurement is submitted
    });
  }

  return (
    <>
      {/* Variant selector */}
      {hasSelectableVariants && (
        <div className="mt-8">
          <VariantSelector
            variants={variants}
            basePrice={basePrice}
            onVariantChange={setSelectedVariant}
          />
        </div>
      )}

      {/* Price display (when no selectable variants, show it above the button) */}
      {!hasSelectableVariants && (
        <div className="mt-8">
          <p className="font-display text-2xl tracking-wide text-foreground">
            {formatPrice(displayPrice)}
          </p>
        </div>
      )}

      {/* Made to Order badge + measurement form */}
      {isCustomizable && (
        <div className="mt-6">
          <Badge variant="filled">Made to Order</Badge>
          <p className="mt-2 font-body text-sm text-muted">
            This item is custom-made. Provide your measurements below for a perfect fit.
          </p>
          <MeasurementForm apiUrl={apiUrl} />
        </div>
      )}

      {/* Add to Cart button */}
      <div className="mt-10">
        <Button
          variant="primary"
          className={`w-full ${!canAddToCart ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={!canAddToCart}
          onClick={handleAddToCart}
        >
          {canAddToCart ? "Add to Cart" : "Select a Variant"}
        </Button>
        {!canAddToCart && hasSelectableVariants && (
          <p className="mt-2 font-body text-xs text-muted text-center">
            Please select size and/or color above
          </p>
        )}
        {isCustomizable && (
          <p className="mt-2 font-body text-xs text-muted text-center">
            Measurements will be confirmed at checkout
          </p>
        )}
      </div>
    </>
  );
}

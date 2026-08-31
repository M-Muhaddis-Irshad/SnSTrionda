"use client";

import { useState, useMemo, useRef, useEffect } from "react";

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

interface VariantSelectorProps {
  variants: ProductVariant[];
  basePrice: number;
  onVariantChange?: (variant: ProductVariant | null) => void;
}

// ---------------------------------------------------------------------------
// Format price in PKR
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

// ---------------------------------------------------------------------------
// VariantSelector Component
// ---------------------------------------------------------------------------

export default function VariantSelector({
  variants,
  basePrice,
  onVariantChange,
}: VariantSelectorProps) {
  // Extract unique sizes and colors from variants
  const sizes = useMemo(
    () => [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[],
    [variants]
  );

  const colors = useMemo(
    () => [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[],
    [variants]
  );

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Find the matching variant based on current selection
  const matchedVariant = useMemo(() => {
    return variants.find((v) => {
      const sizeMatch = selectedSize ? v.size === selectedSize : true;
      const colorMatch = selectedColor ? v.color === selectedColor : true;
      return sizeMatch && colorMatch;
    }) || null;
  }, [variants, selectedSize, selectedColor]);

  // Display price: variant price override or base price
  const displayPrice = matchedVariant?.price ?? basePrice;

  // Notify parent of variant change via callback
  // Using useEffect to avoid calling during render
  const prevVariantRef = useRef<string | null>(null);
  useEffect(() => {
    const variantKey = matchedVariant?.id || null;
    if (variantKey !== prevVariantRef.current) {
      prevVariantRef.current = variantKey;
      onVariantChange?.(matchedVariant);
    }
  }, [matchedVariant, onVariantChange]);

  // Don't render if there are no selectable options
  if (sizes.length === 0 && colors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Size selector */}
      {sizes.length > 0 && (
        <div>
          <h3 className="font-body text-sm tracking-wider uppercase text-muted mb-3">
            Size
          </h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 font-body text-sm tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  selectedSize === size
                    ? "border border-chrome-200 bg-chrome-500 text-chrome-100"
                    : "border border-chrome-500 bg-transparent text-muted hover:border-chrome-400 hover:text-foreground"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color selector */}
      {colors.length > 0 && (
        <div>
          <h3 className="font-body text-sm tracking-wider uppercase text-muted mb-3">
            Color
          </h3>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`px-4 py-2 font-body text-sm tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  selectedColor === color
                    ? "border border-chrome-200 bg-chrome-500 text-chrome-100"
                    : "border border-chrome-500 bg-transparent text-muted hover:border-chrome-400 hover:text-foreground"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic price display */}
      <div className="pt-2">
        <p className="font-display text-2xl tracking-wide text-foreground">
          {formatPrice(displayPrice)}
        </p>
        {matchedVariant?.price && matchedVariant.price !== basePrice && (
          <p className="mt-1 font-body text-sm text-muted line-through">
            {formatPrice(basePrice)}
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

// =============================================================================
// ShopResults — the interactive results column (toolbar + grid/list + pagination)
// =============================================================================

import { useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ui/ProductCard";
import ShopToolbar from "./ShopToolbar";
import ShopPagination from "./ShopPagination";

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  category: { id: string; name: string; slug: string };
  images: { id: string; url: string; altText: string | null; displayOrder: number }[];
  variants: { id: string; size: string | null; color: string | null; price: number | null; stockQuantity: number }[];
}

interface ShopResultsProps {
  products: ShopProduct[];
  sort: string;
  page: number;
  total: number;
  totalPages: number;
}

export default function ShopResults({
  products,
  sort,
  page,
  total,
  totalPages,
}: ShopResultsProps) {
  const [view, setView] = useState<"grid" | "list">("grid");

  const from = total === 0 ? 0 : (page - 1) * 12 + 1;
  const to = Math.min(page * 12, total);

  return (
    <div className="min-w-0 flex-1">
      {/* Count */}
      <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-muted">
        Showing {from}–{to} of {total} products
      </p>

      <ShopToolbar sort={sort} view={view} onViewChange={setView} />

      {products.length === 0 ? (
        <div className="border border-chrome-500/70 py-20 text-center">
          <p className="font-display text-xl tracking-wide text-foreground">No products found</p>
          <p className="mt-2 font-body text-sm text-muted">
            Try adjusting or clearing your filters.
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="mt-8 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} layout="grid" />
          ))}
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-chrome-500/70 border-y border-chrome-500/70">
          {products.map((product) => {
            const img = product.images[0];
            const variantPrices = product.variants
              .map((v) => v.price)
              .filter((p): p is number => p !== null);
            const hasSale = variantPrices.length > 0 && variantPrices.some((p) => p < product.basePrice);
            const price = hasSale ? Math.min(...variantPrices) : product.basePrice;
            return (
              <li key={product.id}>
                <Link
                  href={`/products/${product.slug}`}
                  className="group flex items-center gap-5 py-5"
                >
                  <span className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden border border-chrome-500 bg-surface">
                    {img?.url ? (
                      <img src={img.url} alt={img.altText || product.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-chrome-400">—</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-body text-xs uppercase tracking-[0.2em] text-muted">
                      {product.category.name}
                    </span>
                    <span className="mt-1 block truncate font-display text-lg tracking-wide text-foreground">
                      {product.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {hasSale && (
                      <span className="block font-body text-xs text-chrome-400 line-through">
                        Rs. {product.basePrice.toLocaleString("en-PK")}
                      </span>
                    )}
                    <span className="font-body text-sm text-foreground">
                      Rs. {price.toLocaleString("en-PK")}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <ShopPagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}
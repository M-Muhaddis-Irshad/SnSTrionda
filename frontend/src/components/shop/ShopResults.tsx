"use client";

// =============================================================================
// ShopResults — the interactive results column (toolbar + grid/list + pagination)
// =============================================================================

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ui/ProductCard";
import ShopToolbar from "./ShopToolbar";
import ShopPagination from "./ShopPagination";
import { gsap } from "@/lib/motion";

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  isCustomizable?: boolean;
  category: { id: string; name: string; slug: string };
  images: { id: string; url: string; altText: string | null; displayOrder: number }[];
  variants: { id: string; size: string | null; color: string | null; price: number | null; stockQuantity: number }[];
  discount?: {
    id: string;
    name: string;
    type: "PERCENT" | "FLAT";
    value: number;
  } | null;
  discountedPrice?: number | null;
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
  const resultsRef = useRef<HTMLDivElement>(null);
  const prevSignature = useRef("");
  const prevCtx = useRef<gsap.Context | null>(null);

  const from = total === 0 ? 0 : (page - 1) * 12 + 1;
  const to = Math.min(page * 12, total);

  // Stagger-reveal ONLY the cards that are new to this result set (filter /
  // pagination / view changes). Cards that persist across renders (e.g. a sort
  // change) are left untouched so animations never stack or re-hide content.
  // Every ScrollTrigger/tween is scoped in a gsap.context that is reverted
  // before the next set builds — nothing accumulates across filter changes.
  useLayoutEffect(() => {
    const root = resultsRef.current;
    if (!root) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const ids = products.map((p) => p.id).join(",");
    const signature = `${view}|${page}|${ids}`;
    if (signature === prevSignature.current) return;

    const prevIds = new Set(
      (prevSignature.current.split("|")[2] || "").split(",").filter(Boolean)
    );
    prevSignature.current = signature;

    prevCtx.current?.revert();
    const ctx = gsap.context(() => {
      const bySlug = new Map(products.map((p) => [p.slug, p.id]));
      const selector = view === "grid" ? ".product-card" : "li";
      const targets = gsap.utils.toArray<HTMLElement>(selector, root).filter((el) => {
        const anchor = el.matches("a") ? el : el.querySelector<HTMLElement>("a");
        const href = anchor?.getAttribute("href") || "";
        const slug = (href.match(/\/products\/([^/?]+)/) || [])[1];
        const id = slug ? bySlug.get(slug) : undefined;
        return id ? !prevIds.has(id) : true;
      });

      targets.forEach((el, index) => {
        gsap.from(el, {
          y: 18,
          autoAlpha: 0,
          duration: 0.55,
          ease: "power2.out",
          delay: Math.min(index, 12) * 0.06,
          scrollTrigger: {
            trigger: el,
            start: "top 94%",
            once: true,
          },
        });
      });
    }, root);
    prevCtx.current = ctx;
  }, [products, view, page]);

  // Revert remaining tweens/triggers on unmount
  useLayoutEffect(() => () => prevCtx.current?.revert(), []);

  return (
    <div ref={resultsRef} className="min-w-0 flex-1">
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
            const hasVariantSale =
              variantPrices.length > 0 && variantPrices.some((p) => p < product.basePrice);
            const adminSale =
              product.discountedPrice !== undefined &&
              product.discountedPrice !== null &&
              product.discountedPrice < product.basePrice;
            const price = adminSale
              ? product.discountedPrice!
              : hasVariantSale
                ? Math.min(...variantPrices)
                : product.basePrice;
            const showStrike = adminSale || hasVariantSale;
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
                    {showStrike && (
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
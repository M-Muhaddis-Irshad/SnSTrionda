// =============================================================================
// Shared Shop Listing Template
// Used by /shop, /shop/men, /shop/women, /shop/clothing, etc.
// Reuses the same card grid, sorting, and empty-state patterns.
// =============================================================================

import ProductCard from "@/components/ui/ProductCard";

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  isCustomizable?: boolean;
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="py-20 text-center">
      <h2 className="font-display text-2xl tracking-[0.08em] text-foreground mb-3">
        {title}
      </h2>
      <p className="font-body text-sm text-muted max-w-md mx-auto">
        {message}
      </p>
      <a
        href="/shop"
        className="inline-block mt-6 px-6 py-2.5 border border-chrome-400 font-body text-sm tracking-wider text-foreground hover:bg-chrome-500 transition-colors duration-200"
      >
        Browse All Products
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ShopListing — the shared template
// ---------------------------------------------------------------------------

interface ShopListingProps {
  heading: string;
  subtitle?: string;
  products: Product[];
  emptyTitle?: string;
  emptyMessage?: string;
}

export default function ShopListing({
  heading,
  subtitle,
  products,
  emptyTitle = "No products found",
  emptyMessage = "There are no products matching this filter at the moment. Check back soon.",
}: ShopListingProps) {
  if (products.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h1 className="font-display text-4xl tracking-[0.1em] text-foreground sm:text-5xl">
            {heading}
          </h1>
          <div className="mt-3 h-px w-16 bg-chrome-400" />
          <EmptyState title={emptyTitle} message={emptyMessage} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="font-display text-4xl tracking-[0.1em] text-foreground sm:text-5xl">
          {heading}
        </h1>
        <div className="mt-3 h-px w-16 bg-chrome-400" />
        {subtitle && (
          <p className="mt-4 font-body text-sm text-muted">{subtitle}</p>
        )}

        <p className="mt-6 font-body text-xs tracking-wider uppercase text-muted">
          {products.length} product{products.length !== 1 ? "s" : ""}
        </p>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} layout="grid" />
          ))}
        </div>
      </div>
    </main>
  );
}

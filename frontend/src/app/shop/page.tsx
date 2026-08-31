import { Suspense } from "react";
import CategoryFilter from "@/components/shop/CategoryFilter";
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

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
}

interface ProductsResponse {
  message: string;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ---------------------------------------------------------------------------
// Fetch all products
// ---------------------------------------------------------------------------

async function fetchAllProducts(): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${apiUrl}/api/products?limit=50`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch products:", res.status);
      return [];
    }

    const data: ProductsResponse = await res.json();
    return data.data;
  } catch (err) {
    console.error("Error fetching products:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Group products by category
// ---------------------------------------------------------------------------

interface CategoryGroup {
  category: Category;
  products: Product[];
}

function groupByCategory(products: Product[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();

  for (const product of products) {
    const key = product.category.id;
    if (!map.has(key)) {
      map.set(key, { category: product.category, products: [] });
    }
    map.get(key)!.products.push(product);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.category.name.localeCompare(b.category.name)
  );
}

// ---------------------------------------------------------------------------
// ShopPage (Server Component)
// ---------------------------------------------------------------------------

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category || "all";

  const products = await fetchAllProducts();
  const groups = groupByCategory(products);

  const categories = groups.map((g) => g.category);

  const visibleGroups =
    activeCategory === "all"
      ? groups
      : groups.filter((g) => g.category.slug === activeCategory);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Page heading */}
        <h1 className="font-display text-4xl tracking-[0.1em] text-foreground sm:text-5xl">
          Shop
        </h1>
        <div className="mt-3 h-px w-16 bg-chrome-400" />

        {/* Category filter pills */}
        <div className="mt-8">
          <Suspense fallback={null}>
            <CategoryFilter categories={categories} />
          </Suspense>
        </div>

        {/* Category rails */}
        <div className="mt-12 space-y-16">
          {visibleGroups.length > 0 ? (
            visibleGroups.map((group) => (
              <section key={group.category.id} id={group.category.slug}>
                <h2 className="font-display text-2xl tracking-[0.08em] text-foreground sm:text-3xl">
                  {group.category.name}
                </h2>
                <div className="mt-2 h-px w-12 bg-chrome-400" />

                {/* Horizontal scroll rail */}
                <div className="mt-8 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-5 pb-4">
                    {group.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        layout="rail"
                      />
                    ))}
                  </div>
                </div>
              </section>
            ))
          ) : (
            <p className="text-muted text-sm py-8">
              No products found.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

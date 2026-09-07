import ProductCard from "@/components/ui/ProductCard";

// =============================================================================
// /shop/collections — real admin-managed collections from GET /api/collections
// (active collections with their products + live discounts). Falls back to the
// old category-rail layout when no collections have been created yet.
// =============================================================================

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
  isCustomizable?: boolean;
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  discount?: {
    id: string;
    name: string;
    type: "PERCENT" | "FLAT";
    value: number;
  } | null;
  discountedPrice?: number | null;
}

interface StoreCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  products: Product[];
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function fetchCollections(): Promise<StoreCollection[]> {
  try {
    const res = await fetch(`${apiUrl}/api/collections`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error("Error fetching collections:", err);
    return [];
  }
}

async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${apiUrl}/api/products?limit=50`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data;
  } catch {
    return [];
  }
}

function groupByCategory(products: Product[]) {
  const map = new Map<string, { category: Category; products: Product[] }>();
  for (const p of products) {
    const key = p.category.id;
    if (!map.has(key)) map.set(key, { category: p.category, products: [] });
    map.get(key)!.products.push(p);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.category.name.localeCompare(b.category.name)
  );
}

export default async function CollectionsPage() {
  const [collections, fallbackProducts] = await Promise.all([
    fetchCollections(),
    fetchProducts(),
  ]);

  const hasCollections = collections.some((c) => c.products.length > 0);

  // ── Primary: admin-managed collections ────────────────────────────────
  if (hasCollections) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h1 className="font-display text-4xl tracking-[0.1em] text-foreground sm:text-5xl">
            Collections
          </h1>
          <div className="mt-3 h-px w-16 bg-chrome-400" />
          <p className="mt-4 text-sm text-muted">
            Curated edits from the Trionda Wears studio
          </p>

          <div className="mt-12 space-y-20">
            {collections.map((collection) => {
              if (collection.products.length === 0) return null;
              return (
                <section key={collection.id}>
                  {collection.bannerUrl ? (
                    <div className="relative h-52 sm:h-64 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={collection.bannerUrl}
                        alt={collection.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-5 sm:p-8">
                        <h2 className="font-display text-2xl tracking-[0.08em] text-foreground sm:text-3xl">
                          {collection.name}
                        </h2>
                        {collection.description && (
                          <p className="mt-2 font-body text-sm text-muted max-w-xl">
                            {collection.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 className="font-display text-2xl tracking-[0.08em] text-foreground sm:text-3xl">
                        {collection.name}
                      </h2>
                      <div className="mt-2 h-px w-12 bg-chrome-400" />
                      {collection.description && (
                        <p className="mt-3 font-body text-sm text-muted max-w-xl">
                          {collection.description}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-8 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-5 pb-4">
                      {collection.products.map((product) => (
                        <ProductCard key={product.id} product={product} layout="rail" />
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // ── Fallback: group by category (no collections configured yet) ────────
  const groups = groupByCategory(fallbackProducts);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="font-display text-4xl tracking-[0.1em] text-foreground sm:text-5xl">
          Collections
        </h1>
        <div className="mt-3 h-px w-16 bg-chrome-400" />
        <p className="mt-4 text-sm text-muted">
          Browse our curated collections by category
        </p>

        {groups.length > 0 ? (
          <div className="mt-12 space-y-16">
            {groups.map((group) => (
              <section key={group.category.id}>
                <h2 className="font-display text-2xl tracking-[0.08em] text-foreground sm:text-3xl">
                  {group.category.name}
                </h2>
                <div className="mt-2 h-px w-12 bg-chrome-400" />
                <div className="mt-8 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-5 pb-4">
                    {group.products.map((product) => (
                      <ProductCard key={product.id} product={product} layout="rail" />
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <p className="text-muted text-sm">No collections available yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}

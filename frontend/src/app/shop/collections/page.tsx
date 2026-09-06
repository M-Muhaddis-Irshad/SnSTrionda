import ProductCard from "@/components/ui/ProductCard";

interface ProductImage { id: string; url: string; altText: string | null; displayOrder: number; }
interface ProductVariant { id: string; size: string | null; color: string | null; price: number | null; stockQuantity: number; }
interface Category { id: string; name: string; slug: string; }
interface Product { id: string; name: string; slug: string; basePrice: number; isCustomizable?: boolean; category: Category; images: ProductImage[]; variants: ProductVariant[]; }
interface ProductsResponse { message: string; data: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean; }; }

async function fetchProducts(): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${apiUrl}/api/products?limit=50`, { cache: "no-store" });
    if (!res.ok) return [];
    const data: ProductsResponse = await res.json();
    return data.data;
  } catch { return []; }
}

function groupByCategory(products: Product[]) {
  const map = new Map<string, { category: Category; products: Product[] }>();
  for (const p of products) {
    const key = p.category.id;
    if (!map.has(key)) map.set(key, { category: p.category, products: [] });
    map.get(key)!.products.push(p);
  }
  return Array.from(map.values()).sort((a, b) => a.category.name.localeCompare(b.category.name));
}

export default async function CollectionsPage() {
  const products = await fetchProducts();
  const groups = groupByCategory(products);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="font-display text-4xl tracking-[0.1em] text-foreground sm:text-5xl">Collections</h1>
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

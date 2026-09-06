import ProductCard from "@/components/ui/ProductCard";

interface ProductImage { id: string; url: string; altText: string | null; displayOrder: number; }
interface ProductVariant { id: string; size: string | null; color: string | null; price: number | null; stockQuantity: number; }
interface Category { id: string; name: string; slug: string; }
interface Product { id: string; name: string; slug: string; basePrice: number; isCustomizable?: boolean; category: Category; images: ProductImage[]; variants: ProductVariant[]; }
interface ProductsResponse { message: string; data: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean; }; }

const CLOTHING_SLUGS = new Set(["shirts", "trousers", "sherwanis"]);

async function fetchProducts(): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${apiUrl}/api/products?limit=50`, { cache: "no-store" });
    if (!res.ok) return [];
    const data: ProductsResponse = await res.json();
    return data.data;
  } catch { return []; }
}

export default async function ClothingPage() {
  const allProducts = await fetchProducts();
  const products = allProducts.filter((p) => CLOTHING_SLUGS.has(p.category.slug));

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="font-display text-4xl tracking-[0.1em] text-foreground sm:text-5xl">Clothing</h1>
        <div className="mt-3 h-px w-16 bg-chrome-400" />
        <p className="mt-4 text-sm text-muted">
          {products.length} item{products.length !== 1 ? "s" : ""} found
        </p>

        {products.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} layout="grid" />
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <p className="text-muted text-sm">No clothing items found.</p>
          </div>
        )}
      </div>
    </main>
  );
}

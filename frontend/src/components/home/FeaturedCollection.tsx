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

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  category: { id: string; name: string; slug: string };
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
// Fetch products from backend
// ---------------------------------------------------------------------------

async function fetchProducts(): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${apiUrl}/api/products?limit=8`, {
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
// FeaturedCollection Component
// ---------------------------------------------------------------------------

export default async function FeaturedCollection() {
  const products = await fetchProducts();

  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl tracking-[0.1em] text-foreground sm:text-4xl">
          Featured Pieces
        </h2>
        <div className="mt-3 h-px w-16 bg-chrome-400" />
      </div>

      <div className="mt-10 overflow-x-auto scrollbar-hide">
        <div className="flex gap-5 px-4 pb-4 sm:px-6 lg:px-8 xl:px-[max(2rem,calc((100%-80rem)/2+2rem))]">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                layout="rail"
              />
            ))
          ) : (
            <p className="text-muted text-sm py-8">
              No featured products available at the moment.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

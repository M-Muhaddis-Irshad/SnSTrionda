import Card, { CardImage, CardContent } from "@/components/ui/Card";

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
// Format price in PKR
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

// ---------------------------------------------------------------------------
// Fetch products from backend
// ---------------------------------------------------------------------------

async function fetchProducts(): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${apiUrl}/api/products?limit=8`, {
      cache: "no-store", // Always fetch fresh data (no ISR for now)
    });

    if (!res.ok) {
      console.error("Failed to fetch products:", res.status);
      return [];
    }

    const data: ProductsResponse = await res.json();
    return data.data;
  } catch (err) {
    console.error("Error fetching products:", err);
    // Graceful fallback: return empty array so the page doesn't crash
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
        {/* Section heading */}
        <h2 className="font-display text-3xl tracking-[0.1em] text-foreground sm:text-4xl">
          Featured Pieces
        </h2>
        <div className="mt-3 h-px w-16 bg-chrome-400" />
      </div>

      {/* Horizontal scroll rail */}
      <div className="mt-10 overflow-x-auto scrollbar-hide">
        <div
          className="flex gap-5 px-4 pb-4 sm:px-6 lg:px-8 xl:px-[max(2rem,calc((100%-80rem)/2+2rem))]"
        >
          {products.length > 0 ? (
            products.map((product) => (
              <a
                key={product.id}
                href={`/products/${product.slug}`}
                className="flex-shrink-0 w-56 sm:w-64 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className="w-full">
                  <CardImage>
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].altText || product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                        style={{
                          background:
                            "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)",
                        }}
                      />
                    )}
                  </CardImage>
                  <CardContent>
                    <h3 className="font-body text-sm text-foreground group-hover:text-chrome-200 transition-colors duration-200">
                      {product.name}
                    </h3>
                    <p className="mt-1 font-body text-sm text-muted">
                      {formatPrice(product.basePrice)}
                    </p>
                  </CardContent>
                </Card>
              </a>
            ))
          ) : (
            // Graceful fallback: show a message if no products
            <p className="text-muted text-sm py-8">
              No featured products available at the moment.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

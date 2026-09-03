import ProductCard from "@/components/ui/ProductCard";
import GridCards from "@/components/GridCards";

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

export default async function FeaturedCollection() {
  const products = await fetchProducts();

  return (
    <section className="featured-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="section-heading">
          Featured Pieces
        </h2>
        <div className="section-divider" />
      </div>

      {products.length > 0 ? (
        <div className="featured-grid-wrap">
          <GridCards stagger>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                layout="grid"
                showCategoryBadge
                showViewCta
              />
            ))}
          </GridCards>
        </div>
      ) : (
        <div className="featured-grid-wrap">
          <p className="featured-empty">
            No featured products available at the moment.
          </p>
        </div>
      )}
    </section>
  );
}

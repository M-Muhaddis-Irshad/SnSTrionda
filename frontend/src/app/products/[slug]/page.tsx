import { notFound } from "next/navigation";
import Link from "next/link";
import ProductActions from "@/components/products/ProductActions";
import ProductCard from "@/components/ui/ProductCard";
import Badge from "@/components/ui/Badge";

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
  fabricType: string | null;
  sku: string;
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
  description: string | null;
  basePrice: number;
  isCustomizable: boolean;
  isActive: boolean;
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
}

interface ProductDetailResponse {
  message: string;
  data: Product;
}

interface ProductsResponse {
  message: string;
  data: Product[];
  pagination: any;
}

// ---------------------------------------------------------------------------
// Fetch single product by slug
// ---------------------------------------------------------------------------

async function fetchProduct(slug: string): Promise<Product | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${apiUrl}/api/products/${slug}`, {
      cache: "no-store",
    });

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const data: ProductDetailResponse = await res.json();
    return data.data;
  } catch (err) {
    console.error("Error fetching product:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fetch all products (for "You Might Also Like")
// ---------------------------------------------------------------------------

async function fetchRelatedProducts(categoryId: string, excludeId: string): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${apiUrl}/api/products?limit=50`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data: ProductsResponse = await res.json();

    // Filter: same category, exclude current product, max 6
    return data.data
      .filter((p) => p.category.id === categoryId && p.id !== excludeId)
      .slice(0, 6);
  } catch (err) {
    console.error("Error fetching related products:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Format price in PKR
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

// ---------------------------------------------------------------------------
// ProductDetailPage (Server Component)
// ---------------------------------------------------------------------------

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  // Fetch related products from the same category
  const relatedProducts = await fetchRelatedProducts(product.category.id, product.id);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 font-body text-sm text-muted">
          <Link href="/shop" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/shop?category=${product.category.slug}`}
            className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          >
            {product.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Product detail grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Images */}
          <div className="space-y-4">
            {product.images.length > 0 ? (
              product.images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-[3/4] overflow-hidden border border-chrome-500"
                >
                  <img
                    src={image.url}
                    alt={image.altText || product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div
                className="aspect-[3/4] border border-chrome-500"
                style={{
                  background:
                    "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)",
                }}
              />
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {/* Category badge */}
            <Badge variant="outline" className="mb-4 w-fit">
              {product.category.name}
            </Badge>

            {/* Product name */}
            <h1 className="font-display text-3xl tracking-[0.08em] text-foreground sm:text-4xl">
              {product.name}
            </h1>

            {/* Description */}
            {product.description && (
              <p className="mt-6 font-body text-base leading-relaxed text-muted">
                {product.description}
              </p>
            )}

            {/* Price + Variant Selector + Add to Cart (all client-side) */}
            <ProductActions
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              basePrice={Number(product.basePrice)}
              isCustomizable={product.isCustomizable}
              variants={product.variants}
              images={product.images}
              apiUrl={process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}
            />
          </div>
        </div>

        {/* You Might Also Like */}
        {relatedProducts.length > 0 && (
          <section className="mt-24">
            <h2 className="font-display text-2xl tracking-[0.08em] text-foreground sm:text-3xl">
              You Might Also Like
            </h2>
            <div className="mt-2 h-px w-12 bg-chrome-400" />

            <div className="mt-8 overflow-x-auto scrollbar-hide">
              <div className="flex gap-5 pb-4">
                {relatedProducts.map((related) => (
                  <ProductCard
                    key={related.id}
                    product={related}
                    layout="rail"
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

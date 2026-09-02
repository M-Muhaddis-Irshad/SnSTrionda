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

  const relatedProducts = await fetchRelatedProducts(product.category.id, product.id);

  return (
    <main className="page-main">
      <div className="page-container">
        {/* Breadcrumb */}
        <nav className="product-detail-breadcrumb">
          <Link href="/shop" className="product-detail-breadcrumb-link">
            Shop
          </Link>
          <span className="product-detail-breadcrumb-sep">/</span>
          <Link
            href={`/shop?category=${product.category.slug}`}
            className="product-detail-breadcrumb-link"
          >
            {product.category.name}
          </Link>
          <span className="product-detail-breadcrumb-sep">/</span>
          <span className="product-detail-breadcrumb-current">{product.name}</span>
        </nav>

        {/* Product detail grid */}
        <div className="product-detail-grid">
          {/* Images */}
          <div className="product-detail-images">
            {product.images.length > 0 ? (
              product.images.map((image) => (
                <div key={image.id} className="product-detail-image-wrap">
                  <img
                    src={image.url}
                    alt={image.altText || product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="product-detail-image-placeholder" />
            )}
          </div>

          {/* Details */}
          <div className="product-detail-info">
            <Badge variant="outline" className="mb-4 w-fit">
              {product.category.name}
            </Badge>

            <h1 className="product-detail-name">
              {product.name}
            </h1>

            {product.description && (
              <p className="product-detail-desc">
                {product.description}
              </p>
            )}

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
          <section className="product-detail-related">
            <h2 className="section-heading section-heading--sm">
              You Might Also Like
            </h2>
            <div className="section-divider section-divider--sm" />

            <div className="product-detail-related-scroll">
              <div className="product-detail-related-track">
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

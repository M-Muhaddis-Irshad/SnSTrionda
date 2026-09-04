import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductGallery from "@/components/products/ProductGallery";
import ProductPurchasePanel from "@/components/products/ProductPurchasePanel";
import ProductDetailTabs from "@/components/products/ProductDetailTabs";
import ProductReviews from "@/components/products/ProductReviews";
import ProductCard from "@/components/ui/ProductCard";
import BenefitsBar from "@/components/BenefitsBar";
import FadeIn from "@/components/motion/FadeIn";

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

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  isCustomizable: boolean;
  category: { id: string; name: string; slug: string };
  images: ProductImage[];
  variants: ProductVariant[];
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
}

interface ProductDetailResponse {
  message: string;
  data: Product;
}

interface ReviewsResponse {
  data: Review[];
}

interface ProductsResponse {
  message: string;
  data: Product[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/api/products/${slug}`, { cache: "no-store" });
    if (res.status === 404 || !res.ok) return null;
    const data: ProductDetailResponse = await res.json();
    return data.data;
  } catch (err) {
    console.error("Error fetching product:", err);
    return null;
  }
}

async function fetchReviews(productId: string): Promise<Review[]> {
  try {
    const res = await fetch(`${API_URL}/api/products/${productId}/reviews`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data: ReviewsResponse = await res.json();
    return data.data;
  } catch (err) {
    console.error("Error fetching reviews:", err);
    return [];
  }
}

async function fetchRelatedProducts(categoryId: string, excludeId: string): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/products?limit=50`, { cache: "no-store" });
    if (!res.ok) return [];
    const data: ProductsResponse = await res.json();
    return data.data
      .filter((p) => p.category.id === categoryId && p.id !== excludeId)
      .slice(0, 4);
  } catch (err) {
    console.error("Error fetching related products:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// generateMetadata — per-product title/description/OG image
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "This product is no longer available.",
    };
  }

  const description =
    product.description?.slice(0, 155) ||
    `Shop ${product.name} — premium quality from Trionda Wears with nationwide delivery across Pakistan.`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images.length > 0 ? [product.images[0].url] : undefined,
    },
  };
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
  if (!product) notFound();

  const [reviews, relatedProducts] = await Promise.all([
    fetchReviews(product.id),
    fetchRelatedProducts(product.category.id, product.id),
  ]);

  // Real approved-review average + count
  const rating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  const secondaryImage = product.images[1];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 font-body text-xs uppercase tracking-[0.2em] text-muted">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <span className="text-chrome-400">/</span>
          <Link href="/shop" className="transition-colors hover:text-foreground">Shop</Link>
          <span className="text-chrome-400">/</span>
          <Link href={`/shop?category=${product.category.slug}`} className="transition-colors hover:text-foreground">
            {product.category.name}
          </Link>
          <span className="text-chrome-400">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Product grid */}
        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <FadeIn>
            <ProductGallery images={product.images} productName={product.name} />
          </FadeIn>

          {/* Purchase panel */}
          <FadeIn delay={0.12}>
            <ProductPurchasePanel
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              categoryName={product.category.name}
              basePrice={Number(product.basePrice)}
              isCustomizable={product.isCustomizable}
              variants={product.variants}
              images={product.images}
              apiUrl={API_URL}
              rating={rating}
              reviewCount={reviews.length}
            />
          </FadeIn>
        </div>

        {/* Tabs + accordion */}
        <div className="mt-16 border-t border-chrome-500/70 pt-8">
          <ProductDetailTabs
            description={product.description}
            variants={product.variants}
            isCustomizable={product.isCustomizable}
            categoryName={product.category.name}
          />
        </div>

        {/* Secondary lifestyle image */}
        {secondaryImage && (
          <section className="mt-16" aria-label="Lifestyle imagery">
            <div className="relative aspect-[21/9] overflow-hidden border border-chrome-500">
              <img
                src={secondaryImage.url}
                alt={secondaryImage.altText || `${product.name} — lifestyle`}
                className="h-full w-full object-cover"
              />
            </div>
          </section>
        )}

        {/* Customer reviews — approved only */}
        <div className="mt-16">
          <ProductReviews productId={product.id} />
        </div>

        {/* You Might Also Like */}
        {relatedProducts.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-2xl tracking-[0.1em] text-foreground">
              You Might Also Like
            </h2>
            <div className="mt-3 h-px w-12 bg-chrome-400" />
            <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4 sm:gap-6">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} layout="grid" />
              ))}
            </div>
          </section>
        )}
      </div>

      <BenefitsBar />
    </main>
  );
}
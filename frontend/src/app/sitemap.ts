import type { MetadataRoute } from "next";

// ---------------------------------------------------------------------------
// Sitemap — home, shop, informational pages, plus every live category and
// product pulled from the products API at render time. Falls back to the
// static routes only if the API is unreachable, so the build never breaks.
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sns-trionda.vercel.app";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const revalidate = 3600;

interface Category {
  id: string;
  slug: string;
}

interface Product {
  id: string;
  slug: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/` },
    { url: `${BASE_URL}/shop` },
    { url: `${BASE_URL}/shop/men` },
    { url: `${BASE_URL}/shop/women` },
    { url: `${BASE_URL}/shop/clothing` },
    { url: `${BASE_URL}/shop/new-arrivals` },
    { url: `${BASE_URL}/shop/collections` },
    { url: `${BASE_URL}/about` },
    { url: `${BASE_URL}/contact` },
    { url: `${BASE_URL}/shipping` },
    { url: `${BASE_URL}/returns` },
    { url: `${BASE_URL}/faq` },
    { url: `${BASE_URL}/terms-and-conditions` },
    { url: `${BASE_URL}/privacy` },
  ];

  let categoryRoutes: MetadataRoute.Sitemap = [];
  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const [categoryRes, productRes] = await Promise.all([
      fetch(`${API_URL}/api/products/categories`),
      fetch(`${API_URL}/api/products?limit=100`),
    ]);

    if (categoryRes.ok) {
      const categoryData = (await categoryRes.json()) as { data?: Category[] };
      categoryRoutes = (categoryData.data ?? []).map((category) => ({
        url: `${BASE_URL}/shop?category=${encodeURIComponent(category.slug)}`,
        lastModified: new Date(),
      }));
    }

    if (productRes.ok) {
      const productData = (await productRes.json()) as { data?: Product[] };
      productRoutes = (productData.data ?? []).map((product) => ({
        url: `${BASE_URL}/products/${encodeURIComponent(product.slug)}`,
        lastModified: new Date(),
      }));
    }
  } catch {
    // API unreachable at render time — serve static routes only.
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
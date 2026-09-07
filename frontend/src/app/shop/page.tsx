import type { Metadata } from "next";
import Link from "next/link";
import ShopFilters, { type ShopFacets, type ShopQuery } from "@/components/shop/ShopFilters";
import ShopResults from "@/components/shop/ShopResults";
import BenefitsBar from "@/components/BenefitsBar";

export const metadata: Metadata = {
  title: "Shop All — Luxury Menswear",
  description:
    "Browse the full Trionda Wears collection — premium fabric shirts, trousers, sherwanis & made-to-order pieces. Filter by category, size, colour and fabric.",
};

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
  price: number | null;
  stockQuantity: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  isCustomizable?: boolean;
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

const PAGE_SIZE = 12;

// ---------------------------------------------------------------------------
// Fetch products with real backend filters/sort/pagination
// ---------------------------------------------------------------------------

async function fetchProducts(params: URLSearchParams): Promise<ProductsResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${apiUrl}/api/products?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("Error fetching products:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fetch the live category list (ACTIVE categories only) — the same endpoint
// the homepage cards use. The shop filter must read from here rather than
// deriving categories from the product set, otherwise admin add / activate /
// deactivate / delete changes never reflect on the storefront.
// ---------------------------------------------------------------------------

async function fetchCategories(): Promise<{ id: string; name: string; slug: string }[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${apiUrl}/api/products/categories`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error("Error fetching categories:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Compute filter facets from the full catalog (real values from the DB)
// ---------------------------------------------------------------------------

function computeFacets(products: Product[]): ShopFacets {
  const categoryMap = new Map<string, { id: string; name: string; slug: string }>();
  const sizes = new Set<string>();
  const colors = new Set<string>();
  const materials = new Set<string>();

  for (const p of products) {
    if (!categoryMap.has(p.category.id)) {
      categoryMap.set(p.category.id, p.category);
    }
    for (const v of p.variants) {
      if (v.size) sizes.add(v.size);
      if (v.color) colors.add(v.color);
      if (v.fabricType) materials.add(v.fabricType);
    }
  }

  const prices = products.map((p) => Number(p.basePrice));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 100000;

  return {
    categories: Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    sizes: Array.from(sizes).sort(),
    colors: Array.from(colors).sort(),
    materials: Array.from(materials).sort(),
    minPrice: Math.floor(minPrice / 100) * 100,
    maxPrice: Math.ceil(maxPrice / 100) * 100,
  };
}

// ---------------------------------------------------------------------------
// Parse URL params into the query shape the filters need
// ---------------------------------------------------------------------------

function parseQuery(searchParams: URLSearchParams): ShopQuery {
  return {
    category: searchParams.get("category")?.split(",").filter(Boolean) || undefined,
    sizes: searchParams.get("sizes")?.split(",").filter(Boolean) || undefined,
    colors: searchParams.get("colors")?.split(",").filter(Boolean) || undefined,
    materials: searchParams.get("materials")?.split(",").filter(Boolean) || undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
  };
}

// ---------------------------------------------------------------------------
// ShopPage (Server Component) — ALL PRODUCTS
// ---------------------------------------------------------------------------

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const searchParamsObj = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) value.forEach((v) => searchParamsObj.append(key, v));
    else if (value !== undefined) searchParamsObj.set(key, value);
  }

  const page = Math.max(1, parseInt(searchParamsObj.get("page") || "1", 10));
  searchParamsObj.set("page", String(page));
  searchParamsObj.set("limit", String(PAGE_SIZE));

  const sort = searchParamsObj.get("sort") || "newest";

  const [gridResult, facetResult, categoryResult] = await Promise.all([
    fetchProducts(searchParamsObj),
    fetchProducts(new URLSearchParams({ limit: "200" })),
    fetchCategories(),
  ]);

  const products = gridResult?.data ?? [];
  const pagination = gridResult?.pagination ?? {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  const facets = computeFacets(facetResult?.data ?? []);
  // Override the product-derived category list with the live ACTIVE categories
  // from the API — so category adds/activations/deactivations/deletes made in
  // the admin panel show up in the shop filter immediately.
  facets.categories = categoryResult;
  const query = parseQuery(searchParamsObj);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-body text-xs uppercase tracking-[0.2em] text-muted">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <span className="text-chrome-400">/</span>
          <span className="text-foreground">Shop</span>
        </nav>

        {/* Page title */}
        <h1 className="mt-6 font-display text-4xl uppercase tracking-[0.12em] text-foreground sm:text-5xl">
          All Products
        </h1>

        <div className="mt-4 h-px w-16 bg-chrome-400" />

        {/* Layout: sidebar + results */}
        <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:gap-12">
          <div className="lg:w-64 shrink-0 border-t border-chrome-500/70 lg:border-t-0">
            <ShopFilters facets={facets} current={query} />
          </div>

          <ShopResults
            products={products}
            sort={sort}
            page={page}
            total={pagination.total}
            totalPages={pagination.totalPages}
          />
        </div>
      </div>

      <BenefitsBar />
    </main>
  );
}
// =============================================================================
// Homepage — Dynamic Category Cards
// Renders one card per real category from the database.
// =============================================================================

import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Category images — editorial product photography per category
// (These are curated stock images that match the dark/chrome aesthetic.
//  In production, these would come from the CMS or be uploaded via admin.)
// ---------------------------------------------------------------------------

const CATEGORY_IMAGES: Record<string, string> = {
  shirts:
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=400&fit=crop&q=80",
  trousers:
    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=400&fit=crop&q=80",
  fabric:
    "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=400&fit=crop&q=80",
  sherwanis:
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=400&fit=crop&q=80",
};

// Fallback for categories without a specific image
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop&q=80";

// ---------------------------------------------------------------------------
// Fetch categories from public API
// ---------------------------------------------------------------------------

async function fetchCategories(): Promise<Category[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${apiUrl}/api/products/categories`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch categories:", res.status);
      return [];
    }

    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error("Error fetching categories:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default async function CategoryCards() {
  const categories = await fetchCategories();

  if (categories.length === 0) {
    return null; // Gracefully hide section if no categories
  }

  return (
    <section className="bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <h2 className="font-display text-2xl tracking-[0.1em] text-foreground sm:text-3xl">
          Shop by Category
        </h2>
        <div className="mt-3 h-px w-16 bg-chrome-400" />
      </div>

      {/* Category grid — 2 columns on mobile, dynamic columns on larger */}
      <div className="mt-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, 240px), 1fr))`,
          }}
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group relative block aspect-[3/2] overflow-hidden bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {/* Image */}
              <img
                src={CATEGORY_IMAGES[category.slug] || DEFAULT_IMAGE}
                alt={`${category.name} collection`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Chrome accent line at top */}
              <div className="absolute left-0 right-0 top-0 h-px bg-chrome-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Category name */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <h3 className="font-display text-xl tracking-[0.12em] uppercase text-foreground sm:text-2xl">
                  {category.name}
                </h3>
                <span className="mt-2 inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-chrome-300 transition-colors duration-300 group-hover:text-chrome-200">
                  Explore
                  <svg
                    className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

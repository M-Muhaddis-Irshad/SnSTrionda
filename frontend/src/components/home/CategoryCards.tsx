import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

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

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop&q=80";

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

export default async function CategoryCards() {
  const categories = await fetchCategories();

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="category-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="section-heading">
          Shop by Category
        </h2>
        <div className="section-divider" />
      </div>

      <div className="category-grid">
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
              className="category-card"
            >
              <img
                src={CATEGORY_IMAGES[category.slug] || DEFAULT_IMAGE}
                alt={`${category.name} collection`}
                className="category-card-img"
              />

              <div className="category-card-overlay" />

              <div className="category-card-hover-line" />

              <div className="category-card-content">
                <h3 className="category-card-title">
                  {category.name}
                </h3>
                <span className="category-card-explore">
                  Explore
                  <svg
                    className="category-card-arrow"
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

"use client";

import { useRouter, useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFilterProps {
  categories: Category[];
}

// ---------------------------------------------------------------------------
// CategoryFilter Component
// ---------------------------------------------------------------------------
// Uses URL search params (?category=slug) so the Server Component page can
// read the active filter and conditionally render rails. "all" or no param = show all.

export default function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("category") || "all";

  const allOption: Category = { id: "all", name: "All", slug: "all" };
  const options = [allOption, ...categories];

  function handleSelect(slug: string) {
    if (slug === "all") {
      router.push("/shop");
    } else {
      router.push(`/shop?category=${slug}`);
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
      {options.map((cat) => (
        <button
          key={cat.slug}
          type="button"
          onClick={() => handleSelect(cat.slug)}
          className={`flex-shrink-0 px-5 py-2 font-body text-sm tracking-wider transition-all duration-200 ${
            activeSlug === cat.slug
              ? "border border-chrome-200 bg-chrome-500 text-chrome-100"
              : "border border-chrome-500 bg-transparent text-muted hover:border-chrome-400 hover:text-foreground"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

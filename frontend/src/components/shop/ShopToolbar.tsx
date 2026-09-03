"use client";

// =============================================================================
// ShopToolbar — sort dropdown (real backend sort param) + grid/list view toggle
// =============================================================================

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A–Z" },
];

export default function ShopToolbar({
  sort,
  view,
  onViewChange,
}: {
  sort: string;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") params.delete("sort");
    else params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-chrome-500/70 pb-4">
      {/* Sort */}
      <label className="flex items-center gap-3">
        <span className="hidden sm:inline font-body text-xs uppercase tracking-[0.25em] text-muted">
          Sort
        </span>
        <select
          value={sort}
          onChange={(e) => updateSort(e.target.value)}
          className="border border-chrome-500 bg-surface px-3 py-2 font-body text-sm text-foreground focus:border-chrome-300 focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {/* Grid / list toggle */}
      <div className="flex items-center border border-chrome-500">
        <button
          type="button"
          aria-label="Grid view"
          onClick={() => onViewChange("grid")}
          className={`flex h-9 w-9 items-center justify-center transition-colors ${
            view === "grid"
              ? "bg-foreground text-background"
              : "text-muted hover:text-foreground"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="List view"
          onClick={() => onViewChange("list")}
          className={`flex h-9 w-9 items-center justify-center border-l border-chrome-500 transition-colors ${
            view === "list"
              ? "bg-foreground text-background"
              : "text-muted hover:text-foreground"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
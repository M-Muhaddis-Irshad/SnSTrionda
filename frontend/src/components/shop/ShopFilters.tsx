"use client";

// =============================================================================
// ShopFilters — collapsible filter sidebar.
// Local draft state; Apply / Clear All push real URL params that the server
// component uses to query the backend. Size/Color/Material/Category all map to
// real query params on GET /api/products (variant faceting).
// =============================================================================

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface ShopFacets {
  categories: { id: string; name: string; slug: string }[];
  sizes: string[];
  colors: string[];
  materials: string[];
  minPrice: number;
  maxPrice: number;
}

export interface ShopQuery {
  category?: string[];
  sizes?: string[];
  colors?: string[];
  materials?: string[];
  minPrice?: number;
  maxPrice?: number;
}

interface ShopFiltersProps {
  facets: ShopFacets;
  current: ShopQuery;
}

// ---------------------------------------------------------------------------
// Collapsible section wrapper
// ---------------------------------------------------------------------------

function FilterSection({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-chrome-500/70">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="font-body text-xs uppercase tracking-[0.25em] text-foreground">
          {label}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          className={`text-chrome-400 transition-transform ${open ? "" : "rotate-180"}`}
        >
          <path d="m6 15 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 font-body text-sm text-muted hover:text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 appearance-none border border-chrome-400 bg-transparent checked:border-foreground checked:bg-foreground"
      />
      <span className="flex-1">{label}</span>
      {typeof count === "number" && (
        <span className="text-xs text-chrome-400">{count}</span>
      )}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Dual-handle price range — two native range inputs overlaid
// ---------------------------------------------------------------------------

function PriceRange({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
}) {
  const span = Math.max(1, max - min);

  return (
    <div>
      <div className="relative h-6">
        {/* track */}
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-chrome-500" />
        {/* active span */}
        <div
          className="absolute top-1/2 h-px -translate-y-1/2 bg-chrome-200"
          style={{
            left: `${((valueMin - min) / span) * 100}%`,
            width: `${((valueMax - valueMin) / span) * 100}%`,
          }}
        />
        {/* min handle (overlaid) */}
        <input
          type="range"
          min={min}
          max={max}
          step={100}
          value={valueMin}
          aria-label="Minimum price"
          onChange={(e) => onChange(Math.min(Number(e.target.value), valueMax), valueMax)}
          className="absolute inset-0 h-6 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow"
        />
        {/* max handle (overlaid, on top) */}
        <input
          type="range"
          min={min}
          max={max}
          step={100}
          value={valueMax}
          aria-label="Maximum price"
          onChange={(e) => onChange(valueMin, Math.max(Number(e.target.value), valueMin))}
          className="pointer-events-none absolute inset-0 h-6 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow"
        />
      </div>
      <div className="mt-3 flex items-center justify-between font-body text-xs text-muted">
        <span>Rs. {valueMin.toLocaleString("en-PK")}</span>
        <span>Rs. {valueMax.toLocaleString("en-PK")}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ShopFilters({ facets, current }: ShopFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(current.category ?? []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(current.sizes ?? []);
  const [selectedColors, setSelectedColors] = useState<string[]>(current.colors ?? []);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(current.materials ?? []);
  const [priceMin, setPriceMin] = useState<number>(current.minPrice ?? facets.minPrice);
  const [priceMax, setPriceMax] = useState<number>(current.maxPrice ?? facets.maxPrice);

  const activeCount = useMemo(
    () =>
      selectedCategories.length +
      selectedSizes.length +
      selectedColors.length +
      selectedMaterials.length +
      (priceMin !== facets.minPrice || priceMax !== facets.maxPrice ? 1 : 0),
    [selectedCategories, selectedSizes, selectedColors, selectedMaterials, priceMin, priceMax, facets]
  );

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (selectedCategories.length) params.set("category", selectedCategories.join(","));
    if (selectedSizes.length) params.set("sizes", selectedSizes.join(","));
    if (selectedColors.length) params.set("colors", selectedColors.join(","));
    if (selectedMaterials.length) params.set("materials", selectedMaterials.join(","));
    if (priceMin !== facets.minPrice) params.set("minPrice", String(priceMin));
    if (priceMax !== facets.maxPrice) params.set("maxPrice", String(priceMax));
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedMaterials([]);
    setPriceMin(facets.minPrice);
    setPriceMax(facets.maxPrice);
    router.push(pathname);
  }

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="flex items-center justify-between border-b border-chrome-500/70 py-4">
        <h2 className="font-body text-xs uppercase tracking-[0.25em] text-foreground">
          Filters
        </h2>
        <button
          type="button"
          onClick={clearAll}
          className="font-body text-xs uppercase tracking-wider text-muted underline underline-offset-4 hover:text-foreground"
        >
          Clear All{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
      </div>

      <FilterSection label="Categories">
        <div className="max-h-56 overflow-y-auto pr-1">
          {facets.categories.map((cat) => (
            <CheckboxRow
              key={cat.id}
              label={cat.name}
              checked={selectedCategories.includes(cat.slug)}
              onChange={(c) => toggle(selectedCategories, cat.slug, setSelectedCategories)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Price Range">
        <PriceRange
          min={facets.minPrice}
          max={facets.maxPrice}
          valueMin={priceMin}
          valueMax={priceMax}
          onChange={(min, max) => {
            setPriceMin(min);
            setPriceMax(max);
          }}
        />
      </FilterSection>

      <FilterSection label="Size">
        <div className="grid grid-cols-3 gap-2">
          {facets.sizes.map((size) => {
            const active = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggle(selectedSizes, size, setSelectedSizes)}
                className={`border px-2 py-2 font-body text-xs tracking-wider transition-colors ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-chrome-500 text-muted hover:border-chrome-300 hover:text-foreground"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection label="Color">
        <div className="flex flex-wrap gap-2.5">
          {facets.colors.map((color) => {
            const active = selectedColors.includes(color);
            return (
              <button
                key={color}
                type="button"
                onClick={() => toggle(selectedColors, color, setSelectedColors)}
                aria-label={`Filter by ${color}`}
                title={color}
                className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                  active
                    ? "border-foreground ring-1 ring-foreground ring-offset-2 ring-offset-background"
                    : "border-chrome-500 hover:border-chrome-300"
                }`}
                style={{ backgroundColor: color.toLowerCase() }}
              >
                {active && (
                  <span className="text-[10px] text-white mix-blend-difference">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection label="Material">
        <div className="max-h-56 overflow-y-auto pr-1">
          {facets.materials.map((material) => (
            <CheckboxRow
              key={material}
              label={material}
              checked={selectedMaterials.includes(material)}
              onChange={(c) => toggle(selectedMaterials, material, setSelectedMaterials)}
            />
          ))}
        </div>
      </FilterSection>

      <button
        type="button"
        onClick={applyFilters}
        className="mt-6 w-full border border-chrome-300 bg-transparent py-3 font-body text-sm uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-background"
      >
        Apply Filters
      </button>
    </aside>
  );
}
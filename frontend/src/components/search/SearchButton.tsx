"use client";

// =============================================================================
// SearchButton — header search icon + inline expanding search bar.
// Clicking the icon expands an inline search panel anchored to the header
// (no modal, no backdrop). Results appear in a dropdown below the input.
// Escape or clicking outside collapses it. Queries the existing public
// GET /api/products endpoint (?search= param).
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const DEBOUNCE_MS = 250;

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  category: { id: string; name: string; slug: string };
  images: ProductImage[];
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  basePrice: string | number;
  category: { id: string; name: string };
  images: ProductImage[];
}

type Status = "idle" | "searching" | "done";

function SearchIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

export default function SearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchIdRef = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setStatus("idle");
  }, []);

  // Autofocus the input when expanded
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Esc collapses the inline search
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Clicking outside the search panel collapses it
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open, close]);

  // Debounced search against the existing products endpoint
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      setStatus("idle");
      return;
    }

    const id = ++searchIdRef.current;
    const timer = setTimeout(async () => {
      setStatus("searching");
      try {
        const res = await fetch(
          `${API_URL}/api/products?search=${encodeURIComponent(q)}&limit=8`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`search failed: ${res.status}`);
        const data = await res.json();
        if (searchIdRef.current !== id) return; // stale response
        setResults(data.data || []);
        setStatus("done");
      } catch (err) {
        console.error("Search error:", err);
        if (searchIdRef.current !== id) return;
        setResults([]);
        setStatus("done");
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [open, query]);

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        // Inline expanding panel — anchored to the header, no modal/backdrop
        <div className="absolute right-0 top-full z-50 mt-1 w-[min(88vw,440px)] border border-chrome-500 bg-surface shadow-2xl">
          {/* Input row */}
          <div className="flex items-center gap-3 border-b border-chrome-500 px-4">
            <span className="text-chrome-400">
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="h-12 w-full bg-transparent font-body text-sm tracking-wide text-foreground placeholder:text-chrome-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={close}
              aria-label="Close search"
              className="flex h-8 w-8 items-center justify-center text-chrome-400 transition-colors hover:text-foreground"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Results dropdown */}
          <div className="max-h-[60vh] overflow-y-auto">
            {status === "searching" && (
              <p className="px-4 py-6 font-body text-sm text-muted">Searching…</p>
            )}

            {status === "done" && query.trim() !== "" && results.length === 0 && (
              <p className="px-4 py-6 font-body text-sm text-muted">
                No products found for “{query.trim()}”.
              </p>
            )}

            {status === "idle" && (
              <p className="px-4 py-6 font-body text-sm text-muted">
                Type to search the collection.
              </p>
            )}

            {results.length > 0 && (
              <ul className="divide-y divide-chrome-500/60">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/products/${p.slug}`}
                      onClick={close}
                      className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-chrome-500/30"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-chrome-500 bg-background">
                        {p.images[0]?.url ? (
                          <img
                            src={p.images[0].url}
                            alt={p.images[0].altText || p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-chrome-400">—</span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-body text-sm text-foreground">
                          {p.name}
                        </span>
                        <span className="block font-body text-xs uppercase tracking-wider text-muted">
                          {p.category.name}
                        </span>
                      </span>
                      <span className="shrink-0 font-body text-sm text-foreground">
                        Rs. {Number(p.basePrice).toLocaleString("en-PK")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="header-icon-btn"
          aria-label="Search products"
          onClick={() => setOpen(true)}
        >
          <SearchIcon />
        </button>
      )}
    </div>
  );
}
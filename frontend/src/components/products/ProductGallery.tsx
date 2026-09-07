"use client";

// =============================================================================
// ProductGallery — compact main image + thumbnails. Clicking the main image
// opens a fullscreen modal carousel (prev / next / keyboard) through all
// product images.
// =============================================================================

import { useCallback, useEffect, useState } from "react";

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  displayOrder: number;
}

export default function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselOpen, setCarouselOpen] = useState(false);

  const active = images[activeIndex] ?? images[0];

  // Keyboard navigation while the modal is open
  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!carouselOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCarouselOpen(false);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while the modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [carouselOpen, goPrev, goNext]);

  // Reset to the first image when the product changes
  useEffect(() => {
    setActiveIndex(0);
    setCarouselOpen(false);
  }, [images]);

  if (!active) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center border border-chrome-500 bg-surface">
        <span className="font-body text-sm text-chrome-400">No image available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {/* Thumbnail strip — vertical on sm+, horizontal on mobile */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto sm:flex-col sm:overflow-y-auto sm:max-h-[24rem] scrollbar-hide">
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              className={`h-20 w-16 shrink-0 border transition-colors ${
                index === activeIndex
                  ? "border-foreground"
                  : "border-chrome-500 hover:border-chrome-300"
              }`}
            >
              <img
                src={img.url}
                alt={img.altText || `${productName} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image — compact, click to open the carousel */}
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setCarouselOpen(true)}
          aria-label="Open image gallery"
          className="block w-full max-w-[26rem] mx-auto"
        >
          <div className="relative aspect-[3/4] overflow-hidden border border-chrome-500 bg-surface">
            <img
              src={active.url}
              alt={active.altText || productName}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
            />
          </div>
          <span className="mt-3 inline-flex items-center gap-2 border border-chrome-500 px-4 py-2 font-body text-xs uppercase tracking-[0.2em] text-muted hover:border-chrome-300 hover:text-foreground transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6"
              />
            </svg>
            View gallery
            {images.length > 1 ? ` (${images.length})` : ""}
          </span>
        </button>
      </div>

      {/* Fullscreen modal carousel */}
      {carouselOpen && (
        <div
          className="fixed inset-0 z-[95] flex flex-col bg-black/95 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Product image gallery"
          onClick={() => setCarouselOpen(false)}
        >
          {/* Close */}
          <button
            type="button"
            aria-label="Close gallery"
            onClick={() => setCarouselOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center border border-chrome-500 text-foreground hover:border-chrome-300 hover:bg-chrome-900 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          {/* Counter */}
          <div className="shrink-0 text-center font-body text-xs uppercase tracking-[0.25em] text-muted pb-4">
            {String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </div>

          {/* Image area */}
          <div className="relative flex-1 min-h-0 flex items-center justify-center">
            {/* Prev */}
            {images.length > 1 && (
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-1 sm:left-4 z-10 flex h-11 w-11 items-center justify-center border border-chrome-500 text-foreground hover:border-chrome-300 hover:bg-chrome-900 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}

            <img
              src={active.url}
              alt={active.altText || productName}
              className="max-h-[70vh] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Next */}
            {images.length > 1 && (
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-1 sm:right-4 z-10 flex h-11 w-11 items-center justify-center border border-chrome-500 text-foreground hover:border-chrome-300 hover:bg-chrome-900 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="shrink-0 flex justify-center gap-2.5 pt-5 pb-2 overflow-x-auto">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(index);
                  }}
                  aria-label={`View image ${index + 1}`}
                  className={`h-16 w-13 shrink-0 border transition-colors ${
                    index === activeIndex
                      ? "border-foreground"
                      : "border-chrome-600 hover:border-chrome-400"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.altText || `${productName} thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
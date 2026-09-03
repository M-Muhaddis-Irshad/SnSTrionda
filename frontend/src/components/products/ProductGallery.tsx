"use client";

// =============================================================================
// ProductGallery — vertical thumbnail strip + main image + fullscreen zoom
// =============================================================================

import { useState } from "react";

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
  const [zoom, setZoom] = useState(false);

  const active = images[activeIndex] ?? images[0];

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
        <div className="flex gap-3 overflow-x-auto sm:flex-col sm:overflow-y-auto sm:max-h-[36rem] scrollbar-hide">
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

      {/* Main image */}
      <div className="relative flex-1">
        <div className="relative aspect-[3/4] overflow-hidden border border-chrome-500 bg-surface">
          <img
            src={active.url}
            alt={active.altText || productName}
            className="h-full w-full object-cover"
          />
        </div>
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label="Zoom image"
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center border border-chrome-400 bg-black/50 text-foreground backdrop-blur-sm transition-colors hover:bg-black/70"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6"
            />
          </svg>
        </button>
      </div>

      {/* Fullscreen zoom overlay */}
      {zoom && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 p-6"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom"
        >
          <button
            type="button"
            aria-label="Close zoom"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center border border-chrome-500 text-foreground hover:border-chrome-300"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
          <img
            src={active.url}
            alt={active.altText || productName}
            className="max-h-[88vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";

// ---------------------------------------------------------------------------
// Slide content — editable clothing-brand copy
// ---------------------------------------------------------------------------

interface Slide {
  heading: string;
  headingAccent?: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  overlayGradient: string;
}

const SLIDES: Slide[] = [
  {
    heading: "TRIONDA",
    headingAccent: "WEARS",
    subheading:
      "Fabric, tailored fits, and timeless pieces — crafted for those who wear it best.",
    ctaLabel: "Shop Collection",
    ctaHref: "/shop",
    overlayGradient:
      "radial-gradient(ellipse at 50% 40%, #1a1a1a 0%, #0d0d0d 40%, #000000 100%)",
  },
  {
    heading: "MADE TO",
    headingAccent: "ORDER",
    subheading:
      "Your measurements. Your fabric. Your fit. Every piece tailored exclusively for you.",
    ctaLabel: "Explore Fabrics",
    ctaHref: "/shop?category=fabric",
    overlayGradient:
      "radial-gradient(ellipse at 30% 50%, #141414 0%, #0a0a0a 50%, #000000 100%)",
  },
  {
    heading: "SHERWANI",
    headingAccent: "COLLECTION",
    subheading:
      "Regal silhouettes meet modern tailoring. Statement pieces for occasions that matter.",
    ctaLabel: "View Sherwanis",
    ctaHref: "/shop?category=sherwanis",
    overlayGradient:
      "radial-gradient(ellipse at 70% 40%, #181818 0%, #0c0c0c 45%, #000000 100%)",
  },
  {
    heading: "HERITAGE",
    headingAccent: "FABRICS",
    subheading:
      "Premium cotton, silk blends, and handwoven textiles — sourced for the discerning.",
    ctaLabel: "Shop Fabrics",
    ctaHref: "/shop?category=fabric",
    overlayGradient:
      "radial-gradient(ellipse at 50% 60%, #161616 0%, #0b0b0b 50%, #000000 100%)",
  },
];

// ---------------------------------------------------------------------------
// HeroCarousel Component
// ---------------------------------------------------------------------------

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({
      delay: 5500,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    }),
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setScrollProgress(0);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Autoplay progress animation
  useEffect(() => {
    if (!emblaApi) return;
    let animFrame: number;
    let start = 0;
    const duration = 5500;

    function tick() {
      const autoplayPlugin = emblaApi!.plugins()?.autoplay;
      if (autoplayPlugin && !autoplayPlugin.isPlaying()) {
        setScrollProgress(0);
        animFrame = requestAnimationFrame(tick);
        return;
      }
      if (start === 0) start = performance.now();
      const elapsed = performance.now() - start;
      setScrollProgress(Math.min(elapsed / duration, 1));
      if (elapsed < duration) {
        animFrame = requestAnimationFrame(tick);
      } else {
        start = 0;
        animFrame = requestAnimationFrame(tick);
      }
    }

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [emblaApi, selectedIndex]);

  return (
    <section
      className="relative overflow-hidden"
      role="region"
      aria-roledescription="carousel"
      aria-label="Trionda Wears hero carousel"
    >
      {/* Embla viewport */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex" style={{ touchAction: "pan-y pinch-zoom" }}>
          {SLIDES.map((slide, index) => (
            <div
              key={index}
              className="relative flex-shrink-0 w-full basis-full"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${SLIDES.length}`}
              aria-hidden={index !== selectedIndex}
            >
              {/* Slide background */}
              <div
                className="absolute inset-0 min-h-[90vh]"
                style={{ background: slide.overlayGradient }}
                aria-hidden="true"
              />

              {/* Chrome vertical accent line — active slide only */}
              {index === selectedIndex && (
                <div className="absolute inset-0 opacity-[0.07]" aria-hidden="true">
                  <div
                    className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 0%, #A8A8A8 30%, #A8A8A8 70%, transparent 100%)",
                    }}
                  />
                </div>
              )}

              {/* Chrome corner brackets — top left */}
              <div className="absolute left-6 top-6 sm:left-10 sm:top-10" aria-hidden="true">
                <div className="h-6 w-6 border-l border-t border-chrome-400 opacity-30" />
              </div>
              {/* Chrome corner brackets — top right */}
              <div className="absolute right-6 top-6 sm:right-10 sm:top-10" aria-hidden="true">
                <div className="h-6 w-6 border-r border-t border-chrome-400 opacity-30" />
              </div>
              {/* Chrome corner brackets — bottom left */}
              <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10" aria-hidden="true">
                <div className="h-6 w-6 border-b border-l border-chrome-400 opacity-30" />
              </div>
              {/* Chrome corner brackets — bottom right */}
              <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10" aria-hidden="true">
                <div className="h-6 w-6 border-b border-r border-chrome-400 opacity-30" />
              </div>

              {/* Slide content */}
              <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-4xl items-center justify-center px-6 text-center sm:px-8 lg:px-12">
                <div>
                  {/* Small diamond accent above heading */}
                  <div
                    className="mx-auto mb-6 h-2 w-2 rotate-45 bg-chrome-400 opacity-40"
                    aria-hidden="true"
                  />

                  {/* Heading with split-line treatment */}
                  <h2 className="font-display text-5xl leading-[1.1] tracking-[0.18em] text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
                    <span className="block">{slide.heading}</span>
                    {slide.headingAccent && (
                      <span className="block mt-1 text-chrome-200">
                        {slide.headingAccent}
                      </span>
                    )}
                  </h2>

                  {/* Chrome divider between heading and subheading */}
                  <div
                    className="mx-auto mt-8 mb-6 h-px w-20 bg-gradient-to-r from-transparent via-chrome-300 to-transparent"
                    aria-hidden="true"
                  />

                  <p className="mx-auto max-w-lg font-body text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                    {slide.subheading}
                  </p>

                  {/* CTA button */}
                  <div className="mt-10">
                    <Link
                      href={slide.ctaHref}
                      className="group inline-flex items-center gap-3 border border-chrome-400 bg-transparent px-10 py-4 font-body text-sm tracking-[0.2em] uppercase text-foreground transition-all duration-300 hover:border-chrome-200 hover:bg-chrome-500 hover:text-chrome-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {slide.ctaLabel}
                      <svg
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </Link>
                  </div>

                  {/* Small diamond accent below CTA */}
                  <div
                    className="mx-auto mt-8 h-2 w-2 rotate-45 bg-chrome-400 opacity-40"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows — refined chrome style */}
      <button
        type="button"
        onClick={scrollPrev}
        className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-chrome-500 bg-background/50 backdrop-blur-sm text-muted transition-all duration-200 hover:border-chrome-300 hover:text-foreground sm:left-6 md:left-8"
        aria-label="Previous slide"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={scrollNext}
        className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-chrome-500 bg-background/50 backdrop-blur-sm text-muted transition-all duration-200 hover:border-chrome-300 hover:text-foreground sm:right-6 md:right-8"
        aria-label="Next slide"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>

      {/* Bottom bar: dot indicators + progress */}
      <div className="absolute bottom-6 left-0 right-0 z-20 sm:bottom-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-8 md:px-12">
          {/* Slide counter */}
          <span className="hidden font-body text-xs tracking-wider text-chrome-400 sm:inline">
            {String(selectedIndex + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
          </span>

          {/* Dot indicators */}
          <div
            className="mx-auto flex items-center gap-3 sm:mx-0"
            role="tablist"
            aria-label="Slide indicators"
          >
            {SLIDES.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollTo(index)}
                role="tab"
                aria-selected={index === selectedIndex}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-1.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  index === selectedIndex
                    ? "w-8 bg-chrome-200"
                    : "w-1.5 bg-chrome-500 hover:bg-chrome-400"
                }`}
              />
            ))}
          </div>

          {/* Progress bar for current slide */}
          <div className="hidden w-24 overflow-hidden bg-chrome-500 sm:block" aria-hidden="true">
            <div
              className="h-1.5 bg-chrome-200 transition-none"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top chrome accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px z-20"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, #6E6E6E 20%, #A8A8A8 50%, #6E6E6E 80%, transparent 100%)",
        }}
        aria-hidden="true"
      />
    </section>
  );
}

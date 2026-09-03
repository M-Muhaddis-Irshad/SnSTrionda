"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { gsap } from "@/lib/motion";
import { onAppReady } from "@/lib/motion";

// ---------------------------------------------------------------------------
// Slide content
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
  const sectionRef = useRef<HTMLElement | null>(null);
  const entranceDone = useRef(false);

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

  // One-shot entrance for the currently visible slide's content — plays once
  // the preloader starts revealing the page (never re-runs on autoplay slide
  // changes, and never double-animates what the CSS reveal already did).
  useEffect(() => {
    if (entranceDone.current) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let timeline: gsap.core.Timeline | null = null;

    const unsubscribe = onAppReady(() => {
      if (entranceDone.current) return;
      entranceDone.current = true;
      const section = sectionRef.current;
      if (!section) return;
      const activeSlide = section.querySelector<HTMLElement>('.hero-slide[aria-hidden="false"]');
      if (!activeSlide) return;
      const content = activeSlide.querySelector(".hero-slide-content");
      if (!content) return;

      timeline = gsap.timeline({ defaults: { ease: "power2.out" } });
      timeline
        .fromTo(
          content.querySelector(".hero-diamond"),
          { autoAlpha: 0, scale: 0.5 },
          { autoAlpha: 1, scale: 1, duration: 0.5 }
        )
        .fromTo(
          content.querySelectorAll(".hero-heading > span"),
          { y: 28, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12 },
          "-=0.15"
        )
        .fromTo(
          content.querySelector(".hero-divider"),
          { scaleX: 0, autoAlpha: 0, transformOrigin: "center" },
          { scaleX: 1, autoAlpha: 1, duration: 0.5 },
          "-=0.25"
        )
        .fromTo(
          content.querySelector(".hero-subheading"),
          { y: 18, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.6 },
          "-=0.3"
        )
        .fromTo(
          content.querySelector(".hero-cta"),
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.55 },
          "-=0.35"
        )
        .fromTo(
          content.querySelector(".hero-diamond--bottom"),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.5 },
          "-=0.35"
        );
    });

    return () => {
      unsubscribe();
      timeline?.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="hero-section"
      role="region"
      aria-roledescription="carousel"
      aria-label="Trionda Wears hero carousel"
    >
      {/* Embla viewport */}
      <div ref={emblaRef} className="hero-viewport">
        <div className="hero-track">
          {SLIDES.map((slide, index) => (
            <div
              key={index}
              className="hero-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${SLIDES.length}`}
              aria-hidden={index !== selectedIndex}
            >
              {/* Slide background */}
              <div
                className="hero-slide-bg"
                style={{ background: slide.overlayGradient }}
                aria-hidden="true"
              />

              {/* Chrome vertical accent line — active slide only */}
              {index === selectedIndex && (
                <div className="absolute inset-0 opacity-[0.07]" aria-hidden="true">
                  <div className="hero-accent-line" />
                </div>
              )}

              {/* Chrome corner brackets */}
              <div className="hero-corner hero-corner--tl" aria-hidden="true" />
              <div className="hero-corner hero-corner--tr" aria-hidden="true" />
              <div className="hero-corner hero-corner--bl" aria-hidden="true" />
              <div className="hero-corner hero-corner--br" aria-hidden="true" />

              {/* Slide content */}
              <div className="hero-slide-content">
                <div>
                  {/* Small diamond accent above heading */}
                  <div className="hero-diamond" aria-hidden="true" />

                  {/* Heading */}
                  <h2 className="hero-heading">
                    <span className="hero-heading-line">{slide.heading}</span>
                    {slide.headingAccent && (
                      <span className="hero-heading-accent">
                        {slide.headingAccent}
                      </span>
                    )}
                  </h2>

                  {/* Chrome divider */}
                  <div className="hero-divider" aria-hidden="true" />

                  <p className="hero-subheading">
                    {slide.subheading}
                  </p>

                  {/* CTA button */}
                  <div className="mt-10">
                    <Link href={slide.ctaHref} className="hero-cta" data-gsap-lift>
                      {slide.ctaLabel}
                      <svg
                        className="hero-cta-arrow"
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
                  <div className="hero-diamond--bottom" aria-hidden="true" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        type="button"
        onClick={scrollPrev}
        className="hero-nav-btn hero-nav-btn--prev"
        aria-label="Previous slide"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <button
        type="button"
        onClick={scrollNext}
        className="hero-nav-btn hero-nav-btn--next"
        aria-label="Next slide"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Bottom bar: dot indicators + progress */}
      <div className="hero-bottom-bar">
        <div className="hero-bottom-inner">
          {/* Slide counter */}
          <span className="hero-counter">
            {String(selectedIndex + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
          </span>

          {/* Dot indicators */}
          <div
            className="hero-dots"
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
                className={`hero-dot ${
                  index === selectedIndex
                    ? "hero-dot--active"
                    : "hero-dot--inactive"
                }`}
              />
            ))}
          </div>

          {/* Progress bar for current slide */}
          <div className="hero-progress-track" aria-hidden="true">
            <div
              className="hero-progress-bar"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top chrome accent line */}
      <div className="hero-top-line" aria-hidden="true" />
    </section>
  );
}

"use client";

// =============================================================================
// GridCards — responsive grid with a staggered scroll-into-view reveal.
//
// Each child is wrapped in a `.featured-grid-item`; when `stagger` is true the
// items are revealed with GSAP (ScrollTrigger, once each) instead of the old
// CSS keyframe animation, so nothing double-animates and the reveal happens
// when the cards actually enter the viewport. Cleanup is scoped through
// gsap.context() — unmount reverts every tween/trigger. Prefers-reduced-motion
// leaves the cards fully visible.
// =============================================================================

import { Children, useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/motion";

interface GridCardsProps {
  children: ReactNode;
  stagger?: boolean;
  className?: string;
}

export default function GridCards({
  children,
  stagger = true,
  className = "",
}: GridCardsProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!stagger) return;
    const root = gridRef.current;
    if (!root) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".featured-grid-item", root);
      items.forEach((item, index) => {
        gsap.from(item, {
          y: 26,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power2.out",
          delay: index * 0.08,
          scrollTrigger: {
            trigger: item,
            start: "top 92%",
            once: true,
          },
        });
      });
    }, root);

    return () => {
      ctx.revert();
    };
  }, [stagger]);

  return (
    <div ref={gridRef} className={`featured-grid ${className}`}>
      {Children.toArray(children).map((child, index) => (
        <div key={index} className="featured-grid-item">
          {child}
        </div>
      ))}
    </div>
  );
}

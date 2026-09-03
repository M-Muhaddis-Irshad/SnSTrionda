"use client";

// =============================================================================
// ScrollReveal — server-component-friendly scroll-reveal wrapper. Targets are
// matched by `selector` inside the wrapper's subtree and staggered into view
// with ScrollTrigger (each target plays once when it enters the viewport).
//
// Safety:
//  - honours prefers-reduced-motion (targets stay visible, nothing animates)
//  - gsap.context() scoped: ctx.revert() on unmount kills every tween and
//    ScrollTrigger created here — nothing leaks or fires on unmounted DOM
//  - SSR content never flashes: useLayoutEffect hides targets before paint
// =============================================================================

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  /** CSS selector for the elements to reveal (relative to this wrapper). */
  selector: string;
  /** Per-element stagger delay in seconds. */
  stagger?: number;
  /** Optional transform/opacity to animate from. */
  from?: gsap.TweenVars;
  className?: string;
  style?: React.CSSProperties;
  "aria-hidden"?: boolean | "true" | "false";
}

export default function ScrollReveal({
  children,
  selector,
  stagger = 0.08,
  from = { y: 26 },
  className,
  style,
}: ScrollRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const targets = gsap.utils.toArray<HTMLElement>(selector, root);
      targets.forEach((el, index) => {
        gsap.from(el, {
          ...from,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power2.out",
          delay: index * stagger,
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            once: true,
          },
        });
      });
    }, root);

    return () => {
      ctx.revert();
    };
  }, [selector, stagger]);

  return (
    <div ref={rootRef} className={className} style={style}>
      {children}
    </div>
  );
}

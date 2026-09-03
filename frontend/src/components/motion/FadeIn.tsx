"use client";

// =============================================================================
// FadeIn — entrance wrapper for above-the-fold content (used around the
// product gallery and purchase panel). The entrance plays once the preloader
// signals the page is being revealed (onAppReady) so it is never hidden by an
// opaque overlay and never flashes before hydration.
// =============================================================================

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion";
import { onAppReady } from "@/lib/motion";

interface FadeInProps {
  children: React.ReactNode;
  /** Seconds to wait (after app-ready) before animating. */
  delay?: number;
  className?: string;
}

export default function FadeIn({ children, delay = 0, className }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const tween = gsap.fromTo(
      el,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out", delay }
    );

    // Subscribe only after the tween is built — if app-ready already fired,
    // onAppReady runs the animation immediately on the next frame.
    let unsubscribe = () => {};
    unsubscribe = onAppReady(() => {
      tween.play();
    });
    // Pause until app-ready so content beneath an open preloader isn't animated
    tween.pause();

    return () => {
      unsubscribe();
      tween.kill();
    };
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

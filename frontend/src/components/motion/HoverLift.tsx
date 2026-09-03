"use client";

// =============================================================================
// HoverLift — delegated subtle hover micro-interaction for [data-gsap-lift]
// elements (desktop header nav links, hero CTA). Renders nothing.
//
// Uses transform translateY only — the elements' CSS hover states animate
// colour (transition-colors), so GSAP and Tailwind never fight over the same
// property. Respects prefers-reduced-motion.
// =============================================================================

import { useEffect } from "react";
import { gsap } from "@/lib/motion";

export default function HoverLift() {
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia?.("(hover: hover)").matches) return; // touch: skip

    const targets: Element[] = [];
    const tweens = new Map<Element, gsap.core.Tween>();

    function onOver(e: PointerEvent) {
      const target = (e.target as Element | null)?.closest?.("[data-gsap-lift]");
      if (!target) return;
      tweens.get(target)?.kill();
      if (!targets.includes(target)) targets.push(target);
      tweens.set(target, gsap.to(target, { y: -2, duration: 0.25, ease: "power2.out", overwrite: "auto" }));
    }

    function onOut(e: PointerEvent) {
      const target = (e.target as Element | null)?.closest?.("[data-gsap-lift]");
      if (!target) return;
      tweens.get(target)?.kill();
      tweens.set(target, gsap.to(target, { y: 0, duration: 0.3, ease: "power2.out" }));
    }

    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);

    return () => {
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
      for (const t of tweens.values()) t.kill();
      for (const el of targets) gsap.set(el, { clearProps: "transform" });
    };
  }, []);

  return null;
}

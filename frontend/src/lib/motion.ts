"use client";

// =============================================================================
// motion.ts — single registration point for GSAP + ScrollTrigger and the
// "app ready" signal the preloader dispatches once the first paint is clear.
//
// Importing gsap/ScrollTrigger from here (never directly from "gsap") keeps
// registerPlugin() at module scope — it runs exactly once per client bundle,
// which avoids duplicate-registration warnings.
// =============================================================================

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

// ---------------------------------------------------------------------------
// App-ready event — the preloader fires this when it starts revealing the
// page (or immediately on routes without a preloader). Above-the-fold entrance
// animations subscribe so they never play underneath an opaque overlay.
// ---------------------------------------------------------------------------

export const APP_READY_EVENT = "trionda:app-ready";

let appReadyFired = false;

export function fireAppReady(): void {
  if (appReadyFired) return;
  appReadyFired = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(APP_READY_EVENT));
  }
}

/**
 * Run `fn` once the preloader has started revealing the page. If the event
 * already fired (preloader done, or route without one), runs immediately on
 * the next animation frame. `fallbackMs` guards against the event never
 * firing; returns an unsubscribe function.
 */
export function onAppReady(fn: () => void, fallbackMs = 3000): () => void {
  if (typeof window === "undefined") return () => {};

  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    window.removeEventListener(APP_READY_EVENT, run);
    if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
    requestAnimationFrame(fn);
  };

  let fallbackTimer: number | null = window.setTimeout(run, fallbackMs);
  window.addEventListener(APP_READY_EVENT, run);

  if (appReadyFired) run();

  return () => {
    done = true;
    window.removeEventListener(APP_READY_EVENT, run);
    if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
  };
}

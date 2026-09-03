"use client";

// =============================================================================
// InitialPreloader — full-screen brand preloader shown on the FIRST app load
// of storefront routes (never re-shown on client-side route navigations: the
// root layout mounts it once, and it hides itself permanently after the first
// run).
//
// The percentage is NOT a timer. It is the weighted sum of three REAL tasks:
//   fonts    (25%) — document.fonts.ready resolves when the next/font faces
//                    (Bodoni Moda + Inter) have actually finished loading.
//   content  (35%) — the route's primary server/client data has ARRIVED and
//                    rendered: real DOM markers per route (e.g. category /
//                    product cards, which only exist after the homepage
//                    categories & featured fetch resolve), or the <main>
//                    subtree stops mutating (results/empty states settled).
//   images   (40%) — the above-the-fold images the first paint depends on
//                    actually decoded: the header logomark (every storefront
//                    page) plus the first non-lazy <main> image(s) (homepage
//                    category tiles, product-detail main image). Lazy-loaded
//                    below-fold product photos are intentionally NOT counted —
//                    they don't block first paint.
//
// Two explicit safety valves (fail-open, distinct from the progress logic —
// they only prevent an infinite preloader if a network task hangs):
//   - image task caps at 12s, content task at 10s.
// A 900ms minimum-display floor keeps a very fast load from flashing the
// overlay for 50ms. It delays the hide but never advances the percentage.
// =============================================================================

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { fireAppReady } from "@/lib/motion";

// Routes that render their own chrome (admin + auth) — no brand preloader.
const SKIP_PREFIXES = ["/admin", "/login", "/signup", "/register"];

const MIN_DISPLAY_MS = 900; // display floor only — never drives progress
const IMAGE_CAP_MS = 12_000;
const CONTENT_CAP_MS = 10_000;
const SETTLE_MS = 700; // <main> quiet window that means "content settled"

const WEIGHTS = { fonts: 0.25, content: 0.35, images: 0.4 };

// Route → DOM markers that only exist once that page's data fetch resolved.
// "" (no selectors) means: wait for <main> to settle instead.
function contentSelectors(path: string): string[] {
  if (path === "/") return [".category-card", ".product-card", ".featured-grid-item"];
  if (path.startsWith("/shop")) return [".product-card"];
  return [];
}

function anySelectorMatches(selectors: string[]): boolean {
  return selectors.some((sel) => document.querySelector(sel) !== null);
}

export default function InitialPreloader() {
  const [phase, setPhase] = useState<"loading" | "done">("loading");
  const [percent, setPercent] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<"loading" | "done">("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = window.location.pathname;
    if (SKIP_PREFIXES.some((p) => path.startsWith(p))) {
      setPhase("done");
      return;
    }

    const mountedAt = Date.now();
    const flags = { fonts: false, content: false, images: false };
    const timers: number[] = [];
    const cleanupFns: Array<() => void> = [];
    let disposed = false;
    let tween: gsap.core.Tween | null = null;

    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // --- displayed value tweens toward the REAL target on each event ---
    const target = () =>
      100 * (WEIGHTS.fonts * Number(flags.fonts) + WEIGHTS.content * Number(flags.content) + WEIGHTS.images * Number(flags.images));

    const display = { v: 0 };
    function easeDisplayTo(value: number) {
      tween?.kill();
      tween = gsap.to(display, {
        v: value,
        duration: 0.35,
        ease: "power1.out",
        onUpdate: () => {
          if (!disposed) setPercent(Math.round(display.v));
        },
        onComplete: () => {
          if (!disposed) setPercent(Math.round(display.v));
          maybeFinish();
        },
      });
    }

    function setDone(key: keyof typeof flags) {
      if (disposed || flags[key]) return;
      flags[key] = true;
      easeDisplayTo(target());
    }

    let hidden = false;
    function maybeFinish() {
      if (disposed || hidden || phaseRef.current === "done") return;
      if (Math.round(display.v) < 100) return; // only once every real task is done
      hidden = true;
      const elapsed = Date.now() - mountedAt;
      const finish = () => {
        if (disposed) return;
        // Let above-the-fold entrance animations start as the overlay fades
        fireAppReady();
        gsap.to(overlayRef.current, {
          autoAlpha: 0,
          duration: 0.45,
          ease: "power2.inOut",
          onComplete: () => {
            if (disposed) return;
            phaseRef.current = "done";
            setPhase("done");
          },
        });
      };
      if (elapsed >= MIN_DISPLAY_MS) finish();
      else later(finish, MIN_DISPLAY_MS - elapsed);
    }

    // ---------------- REAL TASK 1/3: fonts ----------------
    document.fonts.ready.then(
      () => setDone("fonts"),
      () => setDone("fonts")
    );

    // ---------------- REAL TASK 2/3: content/data arrival ----------------
    const contentStarted = Date.now();
    let settledId: number | null = null;
    let contentObserver: MutationObserver | null = null;

    const checkContent = () => {
      if (disposed || flags.content) return;
      const selectors = contentSelectors(path);
      if (selectors.length === 0 || anySelectorMatches(selectors)) {
        setDone("content");
        contentObserver?.disconnect();
        return;
      }
      // fail-open cap: never block the page forever on data
      if (Date.now() - contentStarted > CONTENT_CAP_MS) {
        setDone("content");
        contentObserver?.disconnect();
      }
    };

    const armSettle = () => {
      if (disposed || flags.content) return;
      if (settledId !== null) window.clearTimeout(settledId);
      settledId = window.setTimeout(() => {
        if (!disposed && !flags.content) {
          // no DOM churn for SETTLE_MS — content (or its empty state) settled
          setDone("content");
          contentObserver?.disconnect();
        }
      }, SETTLE_MS);
    };

    // Only <main> matters, and only childList changes — the hero carousel
    // mutates style attributes every animation frame, which must not count.
    const mainEl = document.querySelector("main");
    if (mainEl) {
      contentObserver = new MutationObserver(() => {
        checkContent();
        armSettle();
      });
      contentObserver.observe(mainEl, { childList: true, subtree: true });
      cleanupFns.push(() => contentObserver?.disconnect());
    }
    later(checkContent, 0);
    const contentTick = window.setInterval(checkContent, 400);
    timers.push(contentTick);

    // ---------------- REAL TASK 3/3: above-the-fold images ----------------
    const imageStarted = Date.now();
    const tracked = new Set<HTMLImageElement>();
    const doneTargets = new Set<HTMLImageElement>();
    let sawMainImage = false;

    const watchImages = () => {
      if (disposed || flags.images) return;

      const logo = document.querySelector<HTMLImageElement>("header img[src]");
      const mainImgs = Array.from(document.querySelectorAll<HTMLImageElement>('main img:not([loading="lazy"])')).slice(0, 2);
      if (mainImgs.length > 0) sawMainImage = true;

      const targets = [logo, ...mainImgs].filter((img): img is HTMLImageElement => !!img && !!img.src);
      let added = false;
      for (const img of targets) {
        if (tracked.has(img) || doneTargets.has(img)) continue;
        tracked.add(img);
        added = true;
        const finish = () => {
          if (disposed) return;
          doneTargets.add(img);
        };
        if (img.complete && img.naturalWidth > 0) finish();
        else
          img
            .decode()
            .then(finish)
            .catch(finish); // failed/cancelled load — fail open, don't block
      }

      if (added || tracked.size === 0) {
        // still discovering — keep polling
      }

      const allHandled = tracked.size > 0 && [...tracked].every((t) => doneTargets.has(t));
      const noMainEager = !sawMainImage && Date.now() - imageStarted > 4000;
      if (allHandled || noMainEager || Date.now() - imageStarted > IMAGE_CAP_MS) {
        setDone("images");
        return;
      }
      pollImages = window.setTimeout(watchImages, 250);
    };
    let pollImages: number;
    later(watchImages, 0);

    // ---------------- cleanup ----------------
    return () => {
      disposed = true;
      timers.forEach((t) => window.clearTimeout(t));
      if (settledId !== null) window.clearTimeout(settledId);
      if (pollImages) window.clearTimeout(pollImages);
      cleanupFns.forEach((fn) => fn());
      tween?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "done") return null;

  return (
    <div
      ref={overlayRef}
      className="preloader fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background"
      aria-hidden="true"
    >
      {/* Logomark */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo/trionda-icon-mark.png"
        alt=""
        className="preloader-mark"
        width={108}
        height={72}
      />

      {/* Wordmark */}
      <p className="preloader-wordmark">TRIONDA WEARS</p>

      {/* BY SNSTRIONDA — flanked by hairlines */}
      <div className="preloader-byline">
        <span className="preloader-hairline" />
        <span className="preloader-byline-text">BY SNSTRIONDA</span>
        <span className="preloader-hairline" />
      </div>

      {/* LOADING + bar + percentage */}
      <p className="preloader-label">LOADING</p>
      <div className="preloader-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div className="preloader-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="preloader-percent">
        {percent}
        <span className="preloader-percent-unit">%</span>
      </p>

      {/* Tagline */}
      <p className="preloader-tagline">ICONIC STYLE. ENDURING QUALITY.</p>
    </div>
  );
}

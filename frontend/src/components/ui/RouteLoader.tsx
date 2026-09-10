"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin top progress bar that fills while Next.js navigates between routes.
 * Uses a 3-step animation: start → progress → finish.
 */
export default function RouteLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);

  // Trigger on pathname change
  useEffect(() => {
    setActive(true);
    setProgress(0);

    // Fast ramp to 70%
    const t1 = setTimeout(() => setProgress(70), 50);
    // Slow crawl to 90%
    const t2 = setTimeout(() => setProgress(90), 400);
    // Finish
    const t3 = setTimeout(() => setProgress(100), 600);
    const t4 = setTimeout(() => {
      setProgress(0);
      setActive(false);
    }, 750);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [pathname]);

  if (!active && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] transition-all duration-200 ease-out"
      style={{ width: `${progress}%`, backgroundColor: "#F2F2F2" }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading page"
    />
  );
}

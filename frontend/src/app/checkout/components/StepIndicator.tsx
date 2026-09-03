"use client";

import { Fragment } from "react";

export interface CheckoutStep {
  id: string;
  label: string;
}

interface StepIndicatorProps {
  steps: readonly CheckoutStep[];
  currentIndex: number;
  /** Furthest step the user has reached — only these are clickable */
  maxReached: number;
  onNavigate: (index: number) => void;
}

export default function StepIndicator({
  steps,
  currentIndex,
  maxReached,
  onNavigate,
}: StepIndicatorProps) {
  return (
    <nav
      aria-label="Checkout progress"
      className="sticky top-0 z-20 -mx-4 border-b border-chrome-500/70 bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isComplete = index < currentIndex;
          const isReached = index <= maxReached;

          return (
            <Fragment key={step.id}>
              {index > 0 && (
                <li
                  aria-hidden="true"
                  className={`mx-2 h-px flex-1 sm:mx-3 ${
                    index <= currentIndex ? "bg-chrome-300" : "bg-chrome-500"
                  }`}
                />
              )}
              <li className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => isReached && onNavigate(index)}
                  disabled={!isReached}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${step.label} step`}
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full border font-body text-xs
                    transition-colors focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-chrome-300 focus-visible:ring-offset-2
                    focus-visible:ring-offset-background
                    ${
                      isCurrent
                        ? "border-chrome-100 bg-chrome-100 text-black"
                        : isComplete
                          ? "border-chrome-300 bg-chrome-300 text-black"
                          : "border-chrome-500 text-muted"
                    }
                    ${isReached ? "cursor-pointer" : "cursor-not-allowed opacity-70"}
                  `}
                >
                  {isComplete ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </button>
                <span
                  className={`hidden font-body text-[11px] uppercase tracking-wider sm:inline ${
                    isCurrent || isComplete ? "text-chrome-100" : "text-muted"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

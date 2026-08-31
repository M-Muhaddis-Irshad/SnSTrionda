"use client";

import { useState, useCallback } from "react";
import type { FaqItem } from "./page";

// ---------------------------------------------------------------------------
// FaqAccordion Component
// ---------------------------------------------------------------------------

interface FaqAccordionProps {
  items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = useCallback(
    (index: number) => {
      setOpenIndex((prev) => (prev === index ? null : index));
    },
    []
  );

  return (
    <div className="divide-y divide-chrome-500 border border-chrome-500">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;

        return (
          <div key={index}>
            {/* Question button */}
            <h3>
              <button
                id={buttonId}
                type="button"
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-body text-sm text-foreground transition-colors duration-200 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chrome-300"
              >
                <span className="pr-2">{item.question}</span>
                {/* Chevron icon */}
                <svg
                  className={`h-4 w-4 flex-shrink-0 text-muted transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
            </h3>

            {/* Answer panel */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
            >
              <div className="px-5 pb-5">
                <p className="font-body text-sm leading-relaxed text-muted">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

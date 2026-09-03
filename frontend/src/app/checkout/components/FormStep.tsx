"use client";

import type { ReactNode } from "react";

interface FormStepProps {
  stepNumber: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function FormStep({ stepNumber, title, subtitle, children }: FormStepProps) {
  return (
    <section
      aria-labelledby={`step-${stepNumber}-title`}
      className="scroll-mt-24 border-t border-chrome-500 pt-8 first:border-t-0 first:pt-0"
    >
      <div className="mb-6">
        <p className="font-body text-[10px] uppercase tracking-[0.2em] text-muted">
          Step {stepNumber}
        </p>
        <h2
          id={`step-${stepNumber}-title`}
          className="checkout-section-title mb-1"
        >
          {title}
        </h2>
        {subtitle && <p className="font-body text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

import type { Metadata } from "next";
import { TERMS_SECTIONS } from "@/components/modals/termsContent";

export const metadata: Metadata = {
  title: "Terms & Conditions — Trionda Wears",
  description:
    "The terms and conditions that govern the use of the Trionda Wears website and purchases made through it.",
};

// ---------------------------------------------------------------------------
// Terms & Conditions Page (Server Component) — same copy as the T&C modal
// shown on the auth pages, rendered here as a standalone page.
// ---------------------------------------------------------------------------

export default function TermsConditionsPage() {
  return (
    <main className="page-main">
      <div className="page-container--narrow">
        <h1 className="shop-page-heading">Terms &amp; Conditions</h1>
        <div className="section-divider" />

        <p className="mt-8 font-body text-sm leading-relaxed text-muted">
          Please read these terms carefully before using the Trionda Wears
          website or placing an order. By using our site you agree to be bound
          by them.
        </p>

        <div className="mt-10 space-y-8">
          {TERMS_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
                {section.heading}
              </h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-muted">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Trionda Wears",
  description:
    "How Trionda Wears collects, uses, and protects your personal information.",
};

// ---------------------------------------------------------------------------
// Privacy Policy Page (Server Component)
// ---------------------------------------------------------------------------

export default function PrivacyPage() {
  return (
    <main className="page-main">
      <div className="page-container--narrow">
        <h1 className="shop-page-heading">Privacy Policy</h1>
        <div className="section-divider" />

        <div className="mt-10 space-y-8">
          <section>
            <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
              What We Collect
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-muted">
              We collect the information you provide when creating an account
              or placing an order — such as your name, email address, phone
              number, delivery address, and order details. Payment card
              information is processed by our payment provider and is not
              stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
              How We Use It
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-muted">
              Your information is used to process and deliver orders, provide
              customer support, improve our products and services, and — where
              you have opted in — send updates about new collections and
              offers.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
              Your Rights
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-muted">
              You may request access to, correction of, or deletion of your
              personal information at any time by contacting us through the
              Contact page. We do not sell your personal information to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
              Contact
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-muted">
              Questions about this policy? Reach out to us via the Contact page
              and we will be happy to help.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
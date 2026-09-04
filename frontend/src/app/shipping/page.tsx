import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery — Trionda Wears",
  description:
    "Shipping policy for Trionda Wears — delivery timelines, zones, and charges across Pakistan.",
};

const DELIVERY_TIMES = [
  { zone: "Major cities (Lahore, Karachi, Islamabad)", time: "3–5 business days" },
  { zone: "Other cities & towns", time: "4–6 business days" },
  { zone: "Remote areas", time: "Up to 7 business days" },
  { zone: "Made-to-order items (production + delivery)", time: "10–15 business days" },
];

// ---------------------------------------------------------------------------
// Shipping Page (Server Component)
// ---------------------------------------------------------------------------

export default function ShippingPage() {
  return (
    <main className="page-main">
      <div className="page-container--narrow">
        <h1 className="shop-page-heading">Shipping &amp; Delivery</h1>
        <div className="section-divider" />

        <div className="mt-10 space-y-12">
          <section>
            <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
              Delivery Timeline
            </h2>
            <div className="mt-4 divide-y divide-chrome-500 border border-chrome-500">
              {DELIVERY_TIMES.map((row) => (
                <div
                  key={row.zone}
                  className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-body text-sm text-foreground">
                    {row.zone}
                  </span>
                  <span className="font-body text-sm text-chrome-300">
                    {row.time}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
              Shipping Zones &amp; Charges
            </h2>
            <div className="mt-4 space-y-4 font-body text-sm leading-relaxed text-muted">
              <p>
                We currently ship across Pakistan. Shipping charges are
                calculated at checkout based on your delivery address and order
                weight. Orders over a qualifying amount may be eligible for
                free standard shipping.
              </p>
              <p>
                International shipping is not yet available. If you are located
                outside Pakistan and interested in our products, please contact
                us through the Contact page and we will explore options.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
              Order Tracking
            </h2>
            <div className="mt-4 space-y-4 font-body text-sm leading-relaxed text-muted">
              <p>
                Once your order is dispatched, you will receive a tracking
                number so you can follow your parcel every step of the way.
                Please allow 24 hours after dispatch for tracking information
                to become active.
              </p>
              <p>
                Cash on Delivery (COD) orders are paid in cash to the delivery
                rider on arrival — please keep the exact amount ready where
                possible.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
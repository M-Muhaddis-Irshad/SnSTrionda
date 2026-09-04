import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Refunds — Trionda Wears",
  description:
    "Return and exchange policy for Trionda Wears — conditions, process, and exclusions.",
};

// ---------------------------------------------------------------------------
// Returns Page (Server Component)
// ---------------------------------------------------------------------------

export default function ReturnsPage() {
  return (
    <main className="page-main">
      <div className="page-container--narrow">
        <h1 className="shop-page-heading">Returns &amp; Refunds</h1>
        <div className="section-divider" />

        <div className="mt-10 space-y-12">
          <section>
            <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
              Exchanges
            </h2>
            <div className="mt-4 space-y-4 font-body text-sm leading-relaxed text-muted">
              <p>
                We offer exchanges within 7 days of delivery for items that are
                unworn, unwashed, and in their original condition with all tags
                intact. Size exchanges are subject to availability.
              </p>
              <p>
                To start an exchange, contact our support team with your order
                number and the size you need. We will arrange the replacement
                and let you know the next steps.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
              Returns &amp; Refunds
            </h2>
            <div className="mt-4 space-y-4 font-body text-sm leading-relaxed text-muted">
              <p>
                Refunds are issued for defective or incorrectly delivered
                items. Please inspect your order on delivery and report any
                issues within 48 hours, quoting your order number and a photo
                of the item.
              </p>
              <p>
                Once your return is received and inspected, approved refunds
                are processed back to your original payment method within 7–10
                business days. COD orders are refunded via bank transfer.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
              Non-Returnable Items
            </h2>
            <div className="mt-4 space-y-4 font-body text-sm leading-relaxed text-muted">
              <p>
                Custom-measured and made-to-order garments are crafted
                specifically for you and cannot be returned or exchanged unless
                there is a manufacturing defect. Please double-check your
                measurements and size selections before confirming your order.
              </p>
              <p>
                Items that show signs of wear, washing, or damage caused after
                delivery are not eligible for return or exchange.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
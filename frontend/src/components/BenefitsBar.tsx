// =============================================================================
// BenefitsBar — site-wide shipping/policy strip (shop + product pages)
// =============================================================================

const benefits = [
  {
    title: "NATIONWIDE DELIVERY",
    text: "Delivery to 20+ cities across Pakistan with zone-based charges.",
  },
  {
    title: "CASH ON DELIVERY",
    text: "Pay when your order arrives — no advance payment needed.",
  },
  {
    title: "MADE TO ORDER",
    text: "Custom measurements available on select pieces for a perfect fit.",
  },
  {
    title: "EASY RETURNS",
    text: "Exchange or return unworn items within 7 days of delivery.",
  },
];

export default function BenefitsBar() {
  return (
    <section
      aria-label="Store benefits"
      className="border-t border-chrome-500 bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 divide-y divide-chrome-500/70 border-x border-chrome-500/70 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="px-6 py-8 lg:border-r lg:border-chrome-500/70 last:border-r-0">
              <h3 className="font-body text-xs uppercase tracking-[0.25em] text-foreground">
                {benefit.title}
              </h3>
              <p className="mt-3 font-body text-sm leading-relaxed text-muted">
                {benefit.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
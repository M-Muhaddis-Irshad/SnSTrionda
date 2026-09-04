import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Trionda Wears",
  description:
    "The story behind Trionda Wears — a Pakistani luxury clothing brand crafting timeless, tailored pieces.",
};

// ---------------------------------------------------------------------------
// About Page (Server Component)
// ---------------------------------------------------------------------------

export default function AboutPage() {
  return (
    <main className="page-main">
      <div className="page-container--narrow">
        <h1 className="shop-page-heading">About Trionda Wears</h1>
        <div className="section-divider" />

        <div className="mt-10 space-y-12">
          {/* Story */}
          <section>
            <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
              Our Story
            </h2>
            <div className="mt-4 space-y-4 font-body text-sm leading-relaxed text-muted">
              <p>
                Trionda Wears was founded with a single belief: that clothing
                should be timeless, tailored, and true to the person wearing
                it. What began as a small atelier has grown into a destination
                for premium shirts, trousers, fabrics, and made-to-order
                garments — crafted with care, stitch by stitch.
              </p>
              <p>
                From our first collection to today, every piece reflects the
                same commitment: premium materials, precise tailoring, and a
                fit that feels made for you — because it is.
              </p>
            </div>
          </section>

          {/* Mission */}
          <section>
            <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
              Our Mission
            </h2>
            <div className="mt-4 space-y-4 font-body text-sm leading-relaxed text-muted">
              <p>
                We exist to bring made-to-order luxury within reach. By crafting
                each garment specifically for the customer who orders it, we
                avoid overproduction, reduce waste, and deliver a fit that
                off-the-rack simply cannot match.
              </p>
              <p>
                Every order is a collaboration between you and our tailors —
                your measurements, your fabric, your style, finished to our
                exacting standards.
              </p>
            </div>
          </section>

          {/* Values */}
          <section>
            <h2 className="font-display text-xl tracking-[0.1em] text-foreground sm:text-2xl">
              Our Values
            </h2>
            <div className="mt-4 space-y-4 font-body text-sm leading-relaxed text-muted">
              <p>
                <span className="text-foreground">Craftsmanship.</span>{" "}
                Garments are cut and sewn by experienced tailors who take pride
                in every seam.
              </p>
              <p>
                <span className="text-foreground">Quality.</span> Only premium
                fabrics and hardware make it into our collections.
              </p>
              <p>
                <span className="text-foreground">Honesty.</span> Clear sizing,
                clear pricing, and honest delivery timelines — always.
              </p>
              <p>
                <span className="text-foreground">Sustainability.</span>{" "}
                Made-to-order production means nothing is made until someone
                needs it.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
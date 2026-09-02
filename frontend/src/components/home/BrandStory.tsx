import Button from "@/components/ui/Button";

export default function BrandStory() {
  return (
    <section className="brand-story-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="brand-story-grid">
          {/* Text column */}
          <div>
            <span className="brand-story-label">
              Our Story
            </span>
            <h2 className="brand-story-heading">
              Royalty Meets
              <br />
              Modern Tailoring
            </h2>
            <div className="brand-story-divider" />
            <p className="brand-story-text">
              Born from the grandeur of 90s royalty and the precision of modern
              tailoring, Trionda Wears crafts garments that command attention.
              Every stitch tells a story of heritage, every fit shaped for those
              who refuse to blend in.
            </p>
            <div className="brand-story-cta">
              <Button as="a" href="#" variant="ghost">
                Read More
              </Button>
            </div>
          </div>

          {/* Visual placeholder */}
          <div className="brand-story-visual">
            <div className="brand-story-frame-outer" />
            <div className="brand-story-frame-inner" />
            <div className="brand-story-frame-content">
              <div className="brand-story-frame-placeholder" />
            </div>
            <div className="brand-story-corner brand-story-corner--tl" />
            <div className="brand-story-corner brand-story-corner--tr" />
            <div className="brand-story-corner brand-story-corner--bl" />
            <div className="brand-story-corner brand-story-corner--br" />
          </div>
        </div>
      </div>
    </section>
  );
}

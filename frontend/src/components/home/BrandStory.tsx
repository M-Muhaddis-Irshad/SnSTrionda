import Button from "@/components/ui/Button";

export default function BrandStory() {
  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          {/* Text column */}
          <div>
            <span className="font-body text-xs tracking-[0.2em] uppercase text-muted">
              Our Story
            </span>
            <h2 className="mt-4 font-display text-3xl tracking-[0.08em] leading-snug text-foreground sm:text-4xl">
              Royalty Meets
              <br />
              Modern Tailoring
            </h2>
            <div className="mt-4 h-px w-16 bg-chrome-400" />
            <p className="mt-6 max-w-md font-body text-base leading-relaxed text-muted">
              Born from the grandeur of 90s royalty and the precision of modern
              tailoring, Trionda Wears crafts garments that command attention.
              Every stitch tells a story of heritage, every fit shaped for those
              who refuse to blend in.
            </p>
            <div className="mt-8">
              <Button as="a" href="#" variant="ghost">
                Read More
              </Button>
            </div>
          </div>

          {/* Visual placeholder — chrome-gradient-bordered frame */}
          <div className="relative aspect-[4/5] w-full max-w-md md:ml-auto">
            {/* Outer chrome border frame */}
            <div
              className="absolute inset-0"
              style={{
                border: "1px solid #6E6E6E",
                background:
                  "linear-gradient(135deg, rgba(110,110,110,0.1) 0%, transparent 50%, rgba(110,110,110,0.1) 100%)",
              }}
            />
            {/* Inner frame with gap */}
            <div
              className="absolute inset-3"
              style={{
                border: "1px solid #3A3A3A",
              }}
            />
            {/* Inner placeholder content */}
            <div className="absolute inset-6 flex items-center justify-center">
              <div
                className="h-full w-full"
                style={{
                  background:
                    "linear-gradient(160deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)",
                }}
              />
            </div>
            {/* Corner accents */}
            <div className="absolute left-0 top-0 h-8 w-8 border-l border-t border-chrome-300" />
            <div className="absolute right-0 top-0 h-8 w-8 border-r border-t border-chrome-300" />
            <div className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-chrome-300" />
            <div className="absolute bottom-0 right-0 h-8 w-8 border-b border-r border-chrome-300" />
          </div>
        </div>
      </div>
    </section>
  );
}

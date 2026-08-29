import Button from "@/components/ui/Button";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, #1a1a1a 0%, #0d0d0d 40%, #000000 100%)",
        }}
      />

      {/* Subtle chrome accent lines */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, #6E6E6E 50%, transparent 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-5xl leading-tight tracking-[0.15em] text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
          TRIONDA WEARS
        </h1>

        <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-muted sm:text-xl">
          Fabric, tailored fits, and timeless pieces — crafted for those who
          wear it best.
        </p>

        <div className="mt-10">
          <Button as="a" href="/shop" variant="primary">
            Shop Collection
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function AccessoriesPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="font-display text-4xl tracking-[0.1em] text-foreground sm:text-5xl">Accessories</h1>
        <div className="mt-3 h-px w-16 bg-chrome-400" />
        <div className="mt-16 text-center">
          <p className="text-muted text-sm">No accessories available yet.</p>
          <a
            href="/shop"
            className="mt-4 inline-block text-sm text-chrome-200 underline underline-offset-4 hover:text-foreground transition-colors duration-200"
          >
            Browse all products
          </a>
        </div>
      </div>
    </main>
  );
}

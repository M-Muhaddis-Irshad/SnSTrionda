import CheckoutForm from "./CheckoutForm";
import OrderSummaryPanel from "./OrderSummaryPanel";

// ---------------------------------------------------------------------------
// CheckoutPage — Server Component shell with two-column layout
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Page heading */}
        <h1 className="font-display text-3xl tracking-[0.1em] text-foreground">
          Checkout
        </h1>
        <div className="mt-3 h-px w-16 bg-chrome-400" />

        {/* Two-column layout */}
        <div className="mt-10 flex flex-col lg:flex-row gap-10 lg:gap-12">
          {/* Left column — form */}
          <div className="flex-1 min-w-0 order-2 lg:order-1">
            <CheckoutForm />
          </div>

          {/* Right column — order summary (sticky on desktop, accordion on mobile) */}
          <div className="w-full lg:w-[380px] flex-shrink-0 order-1 lg:order-2">
            <OrderSummaryPanel />
          </div>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { OrderStatusClient } from "./OrderStatusClient";

// ---------------------------------------------------------------------------
// OrderConfirmationPage (Server Component)
// ---------------------------------------------------------------------------

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
        {/* Checkmark icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-chrome-400">
          <svg
            className="h-8 w-8 text-chrome-200"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="font-display text-3xl tracking-[0.1em] text-foreground sm:text-4xl">
          Order Confirmed
        </h1>
        <div className="mt-3 h-px w-16 bg-chrome-400 mx-auto" />

        {/* Order number */}
        <div className="mt-8 border border-chrome-500 p-6 inline-block">
          <p className="font-body text-xs tracking-wider uppercase text-muted mb-2">
            Order Number
          </p>
          <p className="font-display text-2xl tracking-wider text-foreground">
            {orderNumber}
          </p>
        </div>

        {/* Client-side payment status polling */}
        <OrderStatusClient orderNumber={orderNumber} />

        {/* Message */}
        <p className="mt-8 font-body text-base text-muted leading-relaxed max-w-md mx-auto">
          Thank you for your order. We&apos;ll process it shortly and send you updates
          on your order status.
        </p>

        <p className="mt-4 font-body text-sm text-muted">
          If you provided an email, you&apos;ll receive a confirmation there.
        </p>

        {/* Actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shop"
            className="inline-block font-body text-sm tracking-[0.2em] uppercase border border-chrome-400 bg-transparent text-foreground px-10 py-4 transition-all duration-300 hover:border-chrome-200 hover:bg-chrome-500 hover:text-chrome-100"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

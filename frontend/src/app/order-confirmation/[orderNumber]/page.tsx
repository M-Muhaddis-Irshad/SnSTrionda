import { OrderConfirmationClient } from "./OrderConfirmationClient";

// ---------------------------------------------------------------------------
// OrderConfirmationPage (Server Component)
// ---------------------------------------------------------------------------
// The server component cannot access localStorage (where the order email
// is stored during checkout), so it only passes the orderNumber to the
// client component. The client fetches the full order data itself using
// the email from localStorage.
// ---------------------------------------------------------------------------

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  return (
    <main className="min-h-screen bg-background">
      <OrderConfirmationClient orderNumber={orderNumber} />
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderData {
  id: string;
  paymentStatus: string;
  paymentMethod: string;
  status: string;
  total: number;
}

// ---------------------------------------------------------------------------
// OrderStatusClient Component
// ---------------------------------------------------------------------------
// Polls the order status endpoint for card-payment orders. When the payment is
// still PENDING it also calls POST /api/payments/safepay/verify with the
// tracker token captured at checkout — this resolves the payment server-side
// even when the Safepay webhook can't reach the backend (e.g. localhost dev)
// or arrives late in production.
// Non-card orders (COD, etc.) show nothing — no polling needed.

export function OrderStatusClient({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function fetchOrder() {
      try {
        // Retrieve email stored during checkout for order verification
        const storedEmail = localStorage.getItem(`trionda-order-email-${orderNumber}`) || "";
        const emailParam = storedEmail ? `?email=${encodeURIComponent(storedEmail)}` : "";
        const res = await fetch(`${apiUrl}/api/orders/${orderNumber}${emailParam}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.data) {
          setOrder(data.data);

          // Card payment still pending? Ask the backend to verify the tracker
          // with Safepay directly — flips the order to PAID/FAILED when the
          // payment actually finished, no webhook required.
          const trackerToken =
            localStorage.getItem(`trionda-order-tracker-${orderNumber}`) || "";
          if (
            data.data.paymentMethod === "CARD" &&
            data.data.paymentStatus === "PENDING" &&
            data.data.id &&
            trackerToken
          ) {
            const verifyRes = await fetch(`${apiUrl}/api/payments/safepay/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.data.id, trackerToken }),
            });
            if (verifyRes.ok && !cancelled) {
              const verifyData = await verifyRes.json();
              if (verifyData.data) setOrder(verifyData.data);
            }
          }
        }
      } catch {
        // Silently ignore fetch errors during polling
      }
    }

    // Fetch immediately on mount
    fetchOrder();

    // For CARD payments, poll until we get a definitive status
    // (payment + verification may take a few seconds after the redirect)
    if (pollCount < 20) {
      // Max 20 polls (every 2s = 40 seconds total)
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          setPollCount((c) => c + 1);
        }
      }, 2000);
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [orderNumber, apiUrl, pollCount]);

  // Don't render anything while loading or if not a card payment
  if (!order) return null;

  // For non-card payments, don't show status polling — just return nothing
  if (order.paymentMethod !== "CARD") return null;

  // Determine badge variant and text based on payment status
  const statusConfig: Record<
    string,
    { text: string; variant: "default" | "outline" | "filled" }
  > = {
    PENDING: { text: "Awaiting Payment", variant: "outline" },
    PAID: { text: "Payment Confirmed", variant: "filled" },
    FAILED: { text: "Payment Failed", variant: "outline" },
    REFUNDED: { text: "Refunded", variant: "outline" },
  };

  const config = statusConfig[order.paymentStatus] || statusConfig.PENDING;

  return (
    <div className="mt-6">
      <Badge variant={config.variant}>{config.text}</Badge>
      {order.paymentStatus === "PENDING" && pollCount < 20 && (
        <p className="mt-3 font-body text-xs text-muted">
          Waiting for payment confirmation...
        </p>
      )}
      {order.paymentStatus === "FAILED" && (
        <p className="mt-3 font-body text-xs text-red-400">
          Payment was not completed. Please try again or contact support.
        </p>
      )}
    </div>
  );
}
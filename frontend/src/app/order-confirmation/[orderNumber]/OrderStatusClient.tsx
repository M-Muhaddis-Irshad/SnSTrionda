"use client";

import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderData {
  paymentStatus: string;
  paymentMethod: string;
  status: string;
  total: number;
}

// ---------------------------------------------------------------------------
// OrderStatusClient Component
// ---------------------------------------------------------------------------
// Polls the order status endpoint for card-payment orders.
// Non-card orders (COD, etc.) show a static badge — no polling needed.

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
        }
      } catch {
        // Silently ignore fetch errors during polling
      }
    }

    // Fetch immediately on mount
    fetchOrder();

    // For CARD payments, poll until we get a definitive status
    // (webhook may arrive after the redirect)
    if (pollCount < 15) {
      // Max 15 polls (every 2s = 30 seconds total)
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
      {order.paymentStatus === "PENDING" && pollCount < 15 && (
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

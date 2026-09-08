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

  // Don't render anything while loading
  if (!order) return null;

  // For COD, don't show anything
  if (order.paymentMethod !== "CARD" && order.paymentMethod !== "JAZZCASH") return null;

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

  // JazzCash: show slip upload UI
  if (order.paymentMethod === "JAZZCASH") {
    return <JazzCashSlipSection order={order} orderNumber={orderNumber} apiUrl={apiUrl} />;
  }

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

// ---------------------------------------------------------------------------
// JazzCash Slip Upload Section
// ---------------------------------------------------------------------------

function JazzCashSlipSection({
  order,
  orderNumber,
  apiUrl,
}: {
  order: OrderData & { paymentSlipUrl?: string | null; paymentRejectionReason?: string | null };
  orderNumber: string;
  apiUrl: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slipUrl, setSlipUrl] = useState(order.paymentSlipUrl || null);
  const [rejectionReason, setRejectionReason] = useState(order.paymentRejectionReason || null);
  const [settings, setSettings] = useState<Record<string, string>>({});

  // Load JazzCash account details
  useEffect(() => {
    fetch(`${apiUrl}/api/settings`)
      .then((r) => r.json())
      .then((res) => { if (res.data) setSettings(res.data); })
      .catch(() => {});
  }, [apiUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMessage(null);
    setError(null);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const storedEmail = localStorage.getItem(`trionda-order-email-${orderNumber}`) || "";
      const token = localStorage.getItem("trionda-auth") ? JSON.parse(localStorage.getItem("trionda-auth") || "{}")?.state?.accessToken : null;
      const formData = new FormData();
      formData.append("slip", file);
      formData.append("orderId", order.id);
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${apiUrl}/api/payments/jazzcash/upload-slip`, {
        method: "POST",
        headers,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setSlipUrl(data.data.paymentSlipUrl);
      setRejectionReason(null);
      setMessage("Payment slip uploaded successfully! We'll verify it shortly.");
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const statusConfig: Record<string, { text: string; variant: "default" | "outline" | "filled" }> = {
    PENDING: { text: "Awaiting Verification", variant: "outline" },
    PAID: { text: "Payment Confirmed", variant: "filled" },
    FAILED: { text: "Payment Rejected", variant: "outline" },
    REFUNDED: { text: "Refunded", variant: "outline" },
  };
  const config = statusConfig[order.paymentStatus] || statusConfig.PENDING;

  return (
    <div className="mt-6 space-y-4 text-left max-w-md mx-auto">
      <Badge variant={config.variant}>{config.text}</Badge>

      {/* JazzCash account details */}
      {(settings.jazzcash_account_name || settings.jazzcash_account_number) && (
        <div className="rounded-lg border border-chrome-500 bg-surface p-4 space-y-1">
          <p className="font-body text-xs text-muted uppercase tracking-wide">Send payment to:</p>
          {settings.jazzcash_account_name && (
            <p className="font-body text-sm text-foreground font-medium">{settings.jazzcash_account_name}</p>
          )}
          {settings.jazzcash_account_number && (
            <p className="font-body text-sm text-foreground font-mono">{settings.jazzcash_account_number}</p>
          )}
          {settings.jazzcash_instructions && (
            <p className="font-body text-xs text-muted mt-2">{settings.jazzcash_instructions}</p>
          )}
        </div>
      )}

      {/* Rejection reason */}
      {rejectionReason && order.paymentStatus === "FAILED" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <p className="font-body text-xs text-red-400 font-medium">Rejection reason:</p>
          <p className="font-body text-sm text-red-300 mt-1">{rejectionReason}</p>
        </div>
      )}

      {/* Uploaded slip preview */}
      {slipUrl && order.paymentStatus !== "FAILED" && (
        <div className="rounded-lg border border-chrome-500 bg-surface p-4">
          <p className="font-body text-xs text-muted mb-2">Uploaded slip:</p>
          <img src={slipUrl} alt="Payment slip" className="rounded max-h-48 object-contain" />
        </div>
      )}

      {/* Upload form — show when no slip uploaded, or when rejected (re-upload) */}
      {(!slipUrl || order.paymentStatus === "FAILED") && (
        <div className="rounded-lg border border-chrome-500 bg-surface p-4 space-y-3">
          <p className="font-body text-sm text-foreground">
            {order.paymentStatus === "FAILED" ? "Upload a corrected payment slip:" : "Upload your payment slip:"}
          </p>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-chrome-700 file:text-foreground file:text-sm file:font-body hover:file:bg-chrome-600" />
          {preview && (
            <img src={preview} alt="Slip preview" className="rounded max-h-32 object-contain" />
          )}
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full rounded bg-chrome-100 px-4 py-2 font-body text-sm font-medium text-background hover:bg-chrome-200 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Slip"}
          </button>
        </div>
      )}

      {message && <p className="font-body text-sm text-green-400">{message}</p>}
      {error && <p className="font-body text-sm text-red-400">{error}</p>}
    </div>
  );
}
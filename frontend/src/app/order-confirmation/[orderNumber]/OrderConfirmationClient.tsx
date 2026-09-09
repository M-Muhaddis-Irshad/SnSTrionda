"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderImage {
  id: string;
  url: string;
  altText: string | null;
}

interface OrderProduct {
  id: string;
  name: string;
  slug: string;
  images: OrderImage[];
}

interface OrderVariant {
  id: string;
  size: string | null;
  color: string | null;
  sku: string;
  price: number | null;
  stockQuantity: number;
  product: OrderProduct;
}

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  productVariant: OrderVariant;
  customMeasurement?: any;
}

interface OrderAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  province: string;
  postalCode?: string | null;
  country?: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  promoCode?: string | null;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentSlipUrl?: string | null;
  paymentRejectionReason?: string | null;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  user: { id: string; email: string; name: string | null };
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatPrice(n: number) {
  return `Rs. ${Number(n).toLocaleString("en-PK")}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const MAX_POLLS = 30; // 30 × 2s = 60 seconds max polling
const POLL_INTERVAL = 2000;

export function OrderConfirmationClient({
  orderNumber,
}: {
  orderNumber: string;
}) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollCountRef = useRef(0);
  const cancelledRef = useRef(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const authUser = useAuthStore((s) => s.user);
  const authToken = useAuthStore((s) => s.accessToken);

  // Fetch order data — called on mount and during polling
  const fetchOrder = useCallback(async (): Promise<OrderData | null> => {
    try {
      const storedEmail =
        localStorage.getItem(`trionda-order-email-${orderNumber}`) ||
        authUser?.email ||
        "";
      const emailParam = storedEmail
        ? `?email=${encodeURIComponent(storedEmail)}`
        : "";
      const headers: Record<string, string> = {};
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      const res = await fetch(
        `${apiUrl}/api/orders/${orderNumber}${emailParam}`,
        { headers }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.data || null;
    } catch {
      return null;
    }
  }, [orderNumber, apiUrl, authUser?.email, authToken]);

  // Try Safepay verification — returns updated order if payment confirmed
  const verifySafepay = useCallback(
    async (orderId: string): Promise<OrderData | null> => {
      try {
        const trackerToken =
          localStorage.getItem(`trionda-order-tracker-${orderNumber}`) || "";
        if (!trackerToken) return null;
        const verifyRes = await fetch(`${apiUrl}/api/payments/safepay/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, trackerToken }),
        });
        if (!verifyRes.ok) return null;
        const verifyData = await verifyRes.json();
        return verifyData.data || null;
      } catch {
        return null;
      }
    },
    [orderNumber, apiUrl]
  );

  // Initial fetch + polling loop
  useEffect(() => {
    cancelledRef.current = false;
    pollCountRef.current = 0;

    async function poll() {
      if (cancelledRef.current) return;

      // Fetch order
      const fetched = await fetchOrder();
      if (cancelledRef.current) return;

      if (fetched) {
        setOrder(fetched);
        setLoading(false);

        // If CARD and still PENDING, try Safepay verification
        if (
          fetched.paymentMethod === "CARD" &&
          fetched.paymentStatus === "PENDING" &&
          fetched.id
        ) {
          const verified = await verifySafepay(fetched.id);
          if (cancelledRef.current) return;
          if (verified) {
            setOrder(verified);
            // If now PAID or FAILED, stop polling
            if (verified.paymentStatus !== "PENDING") return;
          }
        }

        // If payment is resolved, stop
        if (
          fetched.paymentStatus === "PAID" ||
          fetched.paymentStatus === "FAILED"
        ) {
          return;
        }
      } else {
        // Order not found yet — might be a race condition right after redirect
        // Keep polling but show loading
        setLoading(true);
      }

      // Schedule next poll
      pollCountRef.current += 1;
      if (pollCountRef.current < MAX_POLLS && !cancelledRef.current) {
        setTimeout(poll, POLL_INTERVAL);
      } else if (cancelledRef.current) {
        // stopped
      } else {
        // Max polls reached — show timeout message
        setLoading(false);
        if (!fetched) {
          setError(
            "We couldn't find your order. Please check your email or contact support."
          );
        }
        // If we have an order but it's still PENDING after 60s, show a gentle nudge
        // (the webhook might be delayed — the order exists, just not confirmed yet)
      }
    }

    poll();

    return () => {
      cancelledRef.current = true;
    };
  }, [orderNumber, apiUrl, fetchOrder, verifySafepay]);

  // --- Loading state ---
  if (loading && !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-chrome-500 border-t-chrome-200" />
          <p className="text-muted font-body text-sm">
            Loading order details...
          </p>
          <p className="text-chrome-400 font-body text-xs mt-1">
            This usually takes a few seconds.
          </p>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
            <svg
              className="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <p className="text-foreground/85 font-body text-sm">{error}</p>
          <Link
            href="/account/orders"
            className="inline-block mt-4 text-sm font-medium text-foreground underline"
          >
            View My Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  // --- Route to the appropriate layout ---
  if (order.paymentMethod === "CARD") {
    return <CardReceipt order={order} />;
  }
  if (order.paymentMethod === "JAZZCASH") {
    return (
      <SimpleConfirmation
        order={order}
        orderNumber={orderNumber}
        apiUrl={apiUrl}
      />
    );
  }
  return (
    <SimpleConfirmation
      order={order}
      orderNumber={orderNumber}
      apiUrl={apiUrl}
    />
  );
}

// ---------------------------------------------------------------------------
// CARD / Safepay Receipt (full layout)
// ---------------------------------------------------------------------------

function CardReceipt({ order }: { order: OrderData }) {
  const isPaid = order.paymentStatus === "PAID";
  const isPending = order.paymentStatus === "PENDING";

  const card = "rounded-xl border border-chrome-500 bg-surface";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-chrome-500 bg-surface">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="font-display text-lg tracking-[0.15em] text-foreground">
              TRIONDA WEARS
            </p>
            <p className="font-body text-xs text-muted tracking-wider">
              MULTI WEARS
            </p>
          </div>
          <p className="font-body text-xs text-muted text-right">
            Timeless pieces, tailored for you.
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Success banner */}
        {isPaid && (
          <div
            className={`${card} p-6 mb-6 text-center`}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-green-500/40 bg-green-500/10">
              <svg
                className="h-7 w-7 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <p className="font-body text-sm text-green-400 font-semibold uppercase tracking-wider">
              Payment Successful
            </p>
            <h1 className="font-display text-2xl text-foreground mt-2">
              Thank You for Your Order!
            </h1>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted font-body">
              <span>
                Order{" "}
                <span className="font-medium text-foreground">
                  #{order.orderNumber}
                </span>
              </span>
              <span className="text-chrome-400">|</span>
              <span>
                {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
              </span>
            </div>
          </div>
        )}

        {/* Verifying banner */}
        {isPending && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6 mb-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-yellow-500/40 bg-yellow-500/10">
              <svg
                className="h-5 w-5 text-yellow-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <p className="font-body text-sm text-yellow-400">
              Verifying your payment...
            </p>
            <p className="font-body text-xs text-yellow-500/80 mt-1">
              This usually takes a few seconds. You can safely close this page
              and check your orders later.
            </p>
          </div>
        )}

        {/* Failed banner */}
        {order.paymentStatus === "FAILED" && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 mb-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="font-body text-sm text-red-400">
              Payment was not completed.
            </p>
            <Link
              href="/shop"
              className="inline-block mt-3 text-sm font-medium text-red-400 underline"
            >
              Try again
            </Link>
          </div>
        )}

        {isPaid && (
          <>
            {/* Two-column payment details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Payment Details */}
              <div className={`${card} p-5`}>
                <h3 className="font-body text-xs uppercase tracking-wider text-muted mb-3">
                  Payment Details
                </h3>
                <div className="space-y-2">
                  <DetailRow
                    label="Method"
                    value="Credit / Debit Card (Safepay)"
                  />
                  <DetailRow label="Status">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-green-500/30 bg-green-500/10 text-green-400">
                      Paid
                    </span>
                  </DetailRow>
                  <DetailRow
                    label="Amount Paid"
                    value={formatPrice(order.total)}
                    bold
                  />
                  <DetailRow
                    label="Order"
                    value={`#${order.orderNumber}`}
                  />
                </div>
              </div>

              {/* Payment From / To */}
              <div className={`${card} p-5`}>
                <h3 className="font-body text-xs uppercase tracking-wider text-muted mb-3">
                  Payment From / To
                </h3>
                <div className="space-y-2">
                  <DetailRow
                    label="From"
                    value={
                      order.user.name || order.user.email || "Customer"
                    }
                  />
                  <DetailRow label="To" value="Trionda Wears" />
                  <DetailRow
                    label="Payment Gateway"
                    value="Safepay"
                  />
                </div>
                <p className="font-body text-[10px] text-chrome-400 mt-3">
                  Card details are processed by Safepay and not stored by
                  Trionda Wears.
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className={`${card} p-5 mb-6`}>
              <h3 className="font-body text-xs uppercase tracking-wider text-muted mb-4">
                Order Items
              </h3>
              <div className="divide-y divide-chrome-600/60">
                {order.items.map((item) => {
                  const v = item.productVariant;
                  const p = v.product;
                  const img = p.images?.[0]?.url;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 py-3"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-chrome-700 flex-shrink-0">
                        {img ? (
                          <img
                            src={img}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-chrome-400 text-xs">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-foreground font-medium truncate">
                          {p.name}
                        </p>
                        <p className="font-body text-xs text-muted">
                          {v.color && `${v.color} / `}
                          {v.size || "—"} · SKU: {v.sku}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-body text-sm text-foreground">
                          {formatPrice(item.priceAtPurchase)}
                        </p>
                        <p className="font-body text-xs text-muted">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className={`${card} p-5 mb-6`}>
              <div className="space-y-2">
                <SummaryRow
                  label="Subtotal"
                  value={formatPrice(order.subtotal)}
                />
                <SummaryRow
                  label="Shipping"
                  value={formatPrice(order.shippingCost)}
                />
                {order.discount > 0 && (
                  <SummaryRow
                    label="Discount"
                    value={`−${formatPrice(order.discount)}`}
                    green
                  />
                )}
                {order.promoCode && (
                  <SummaryRow label="Promo Code" value={order.promoCode} />
                )}
                <div className="border-t border-chrome-600 pt-2 mt-2">
                  <SummaryRow
                    label="Total Paid"
                    value={formatPrice(order.total)}
                    bold
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className={`${card} p-5 mb-6`}>
              <h3 className="font-body text-xs uppercase tracking-wider text-muted mb-3">
                Shipping Address
              </h3>
              <div className="font-body text-sm text-foreground/90 space-y-0.5">
                <p className="font-medium text-foreground">
                  {order.shippingAddress.fullName}
                </p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress.city},{" "}
                  {order.shippingAddress.province}
                </p>
                {order.shippingAddress.postalCode && (
                  <p>{order.shippingAddress.postalCode}</p>
                )}
                <p>{order.shippingAddress.country || "Pakistan"}</p>
                <p className="text-muted mt-1">
                  {order.shippingAddress.phone}
                </p>
              </div>
            </div>

            {/* Need Help */}
            <div className={`${card} p-5 mb-6`}>
              <h3 className="font-body text-xs uppercase tracking-wider text-muted mb-2">
                Need Help?
              </h3>
              <p className="font-body text-sm text-muted">
                Contact us at{" "}
                <a
                  href="mailto:support@triondawear.com"
                  className="text-foreground underline"
                >
                  support@triondawear.com
                </a>{" "}
                or call{" "}
                <a
                  href="tel:+923001234567"
                  className="text-foreground underline"
                >
                  +92 300 123 4567
                </a>
              </p>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/shop"
            className="inline-block font-body text-sm tracking-[0.15em] uppercase border border-chrome-500 bg-surface text-foreground px-8 py-3 rounded-lg transition hover:border-chrome-400"
          >
            Continue Shopping
          </Link>
          <Link
            href="/account/orders"
            className="inline-block font-body text-sm tracking-[0.15em] uppercase bg-chrome-100 text-background px-8 py-3 rounded-lg transition hover:bg-chrome-200"
          >
            View My Orders
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-chrome-500 pt-6 pb-8">
          <p className="font-display text-sm tracking-[0.15em] text-muted">
            TRIONDA WEARS
          </p>
          <p className="font-body text-xs text-chrome-400 mt-1">
            Timeless pieces, tailored for you.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// COD / JazzCash Simple Confirmation
// ---------------------------------------------------------------------------

function SimpleConfirmation({
  order,
  orderNumber,
  apiUrl,
}: {
  order: OrderData;
  orderNumber: string;
  apiUrl: string;
}) {
  const isJazzCash = order.paymentMethod === "JAZZCASH";
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slipUrl, setSlipUrl] = useState(order.paymentSlipUrl || null);
  const [rejectionReason, setRejectionReason] = useState(
    order.paymentRejectionReason || null
  );

  useEffect(() => {
    if (!isJazzCash) return;
    fetch(`${apiUrl}/api/settings`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setSettings(res.data);
      })
      .catch(() => {});
  }, [isJazzCash, apiUrl]);

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
      const token = localStorage.getItem("trionda-auth")
        ? JSON.parse(localStorage.getItem("trionda-auth") || "{}")?.state
            ?.accessToken
        : null;
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
      setMessage(
        "Payment slip uploaded successfully! We'll verify it shortly."
      );
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
        {/* Checkmark */}
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

        <h1 className="font-display text-3xl tracking-[0.1em] text-foreground sm:text-4xl">
          Order Confirmed
        </h1>
        <div className="mt-3 h-px w-16 bg-chrome-400 mx-auto" />

        <div className="mt-8 border border-chrome-500 p-6 inline-block">
          <p className="font-body text-xs tracking-wider uppercase text-muted mb-2">
            Order Number
          </p>
          <p className="font-display text-2xl tracking-wider text-foreground">
            {orderNumber}
          </p>
        </div>

        {/* JazzCash: account details + slip upload */}
        {isJazzCash && (
          <div className="mt-6 space-y-4 text-left max-w-md mx-auto">
            {/* Status badge */}
            <div className="text-center">
              <span
                className={`inline-block text-xs px-3 py-1 rounded border ${
                  order.paymentStatus === "PAID"
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : order.paymentStatus === "FAILED"
                      ? "bg-red-500/10 text-red-400 border-red-500/30"
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                }`}
              >
                {order.paymentStatus === "PAID"
                  ? "Payment Confirmed"
                  : order.paymentStatus === "FAILED"
                    ? "Payment Rejected"
                    : "Awaiting Verification"}
              </span>
            </div>

            {/* Account details */}
            {(settings.jazzcash_account_name ||
              settings.jazzcash_account_number) && (
              <div className="rounded-lg border border-chrome-500 bg-surface p-4 space-y-1">
                <p className="font-body text-xs text-muted uppercase tracking-wide">
                  Send payment to:
                </p>
                {settings.jazzcash_account_name && (
                  <p className="font-body text-sm text-foreground font-medium">
                    {settings.jazzcash_account_name}
                  </p>
                )}
                {settings.jazzcash_account_number && (
                  <p className="font-body text-sm text-foreground font-mono">
                    {settings.jazzcash_account_number}
                  </p>
                )}
                {settings.jazzcash_instructions && (
                  <p className="font-body text-xs text-muted mt-2">
                    {settings.jazzcash_instructions}
                  </p>
                )}
              </div>
            )}

            {/* Rejection reason */}
            {rejectionReason && order.paymentStatus === "FAILED" && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                <p className="font-body text-xs text-red-400 font-medium">
                  Rejection reason:
                </p>
                <p className="font-body text-sm text-red-300 mt-1">
                  {rejectionReason}
                </p>
              </div>
            )}

            {/* Uploaded slip */}
            {slipUrl && order.paymentStatus !== "FAILED" && (
              <div className="rounded-lg border border-chrome-500 bg-surface p-4">
                <p className="font-body text-xs text-muted mb-2">
                  Uploaded slip:
                </p>
                <img
                  src={slipUrl}
                  alt="Payment slip"
                  className="rounded max-h-48 object-contain"
                />
              </div>
            )}

            {/* Upload form */}
            {(!slipUrl || order.paymentStatus === "FAILED") && (
              <div className="rounded-lg border border-chrome-500 bg-surface p-4 space-y-3">
                <p className="font-body text-sm text-foreground">
                  {order.paymentStatus === "FAILED"
                    ? "Upload a corrected payment slip:"
                    : "Upload your payment slip:"}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-chrome-700 file:text-foreground file:text-sm file:font-body hover:file:bg-chrome-600"
                />
                {preview && (
                  <img
                    src={preview}
                    alt="Slip preview"
                    className="rounded max-h-32 object-contain"
                  />
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

            {message && (
              <p className="font-body text-sm text-green-400">{message}</p>
            )}
            {error && (
              <p className="font-body text-sm text-red-400">{error}</p>
            )}
          </div>
        )}

        <p className="mt-8 font-body text-base text-muted leading-relaxed max-w-md mx-auto">
          Thank you for your order. We&apos;ll process it shortly and send you
          updates on your order status.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shop"
            className="inline-block font-body text-sm tracking-[0.2em] uppercase border border-chrome-400 bg-transparent text-foreground px-10 py-4 transition-all duration-300 hover:border-chrome-200 hover:bg-chrome-500 hover:text-chrome-100"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function DetailRow({
  label,
  value,
  bold,
  children,
}: {
  label: string;
  value?: string;
  bold?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-body text-xs text-muted">{label}</span>
      {children || (
        <span
          className={`font-body text-sm ${bold ? "text-foreground font-semibold" : "text-foreground/85"}`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  green,
}: {
  label: string;
  value: string;
  bold?: boolean;
  green?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`font-body text-sm ${bold ? "text-foreground font-semibold" : "text-muted"}`}
      >
        {label}
      </span>
      <span
        className={`font-body text-sm ${
          bold
            ? "text-foreground font-semibold"
            : green
              ? "text-green-400"
              : "text-foreground/85"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

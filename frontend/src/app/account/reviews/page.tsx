"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import ReviewModal from "./components/ReviewModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderItem {
  quantity: number;
  priceAtPurchase: number;
  productVariant: {
    product: { id: string; name: string; slug: string };
    size: string | null;
    color: string | null;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface MyReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  status: string;
  createdAt: string;
  product: { id: string; name: string; slug: string };
  order: { orderNumber: string };
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "border-yellow-500/50 text-yellow-500",
  APPROVED: "border-green-500/50 text-green-500",
  REJECTED: "border-red-500/50 text-red-500",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          strokeWidth={1.5}
          className={rating >= star ? "fill-chrome-100 text-chrome-100" : "text-chrome-400"}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReviewsPage() {
  const { accessToken } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    orderId: string;
    productId: string;
    productName: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, reviewsRes] = await Promise.all([
        fetch(`${API_URL}/api/orders/mine`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${API_URL}/api/reviews/my`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.data || []);
      }
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setMyReviews(data.data || []);
      }
    } catch {
      // Silent — empty states handle it
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Delivered orders whose products haven't been reviewed yet
  const reviewedProductIds = new Set(myReviews.map((r) => r.product.id));
  const reviewableOrders = orders.filter((o) => o.status === "DELIVERED");

  if (loading) {
    return (
      <div className="border border-chrome-500 bg-surface p-6 text-center">
        <p className="font-body text-sm text-muted">Loading reviews…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Write a review ── */}
      <section>
        <h2 className="font-display text-lg text-foreground mb-1">Write a Review</h2>
        <p className="font-body text-xs text-muted mb-5">
          You can review products from delivered orders. Reviews appear on the
          product page after admin approval.
        </p>

        {reviewableOrders.length === 0 ? (
          <div className="border border-chrome-500 bg-surface p-6 text-center">
            <p className="font-body text-sm text-muted mb-3">
              No delivered orders to review yet.
            </p>
            <Link
              href="/account/orders"
              className="inline-block font-body text-sm text-chrome-200 hover:text-foreground transition-colors"
            >
              View your orders →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviewableOrders.map((order) => {
              const reviewableItems = order.items.filter(
                (item) => !reviewedProductIds.has(item.productVariant.product.id)
              );
              if (reviewableItems.length === 0) return null;

              return (
                <div key={order.id} className="border border-chrome-500 bg-surface p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-body text-sm text-foreground font-medium">
                        {order.orderNumber}
                      </p>
                      <p className="font-body text-xs text-muted mt-0.5">
                        Delivered {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Link
                      href={`/account/orders/${order.orderNumber}`}
                      className="font-body text-xs text-chrome-200 hover:text-foreground transition-colors"
                    >
                      View order →
                    </Link>
                  </div>

                  <div className="border-t border-chrome-500 divide-y divide-chrome-500">
                    {reviewableItems.map((item, idx) => {
                      const product = item.productVariant.product;
                      return (
                        <div
                          key={`${product.id}-${idx}`}
                          className="flex items-center justify-between gap-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="font-body text-sm text-foreground truncate">
                              {product.name}
                            </p>
                            <p className="font-body text-xs text-muted mt-0.5">
                              {item.productVariant.size || ""}{" "}
                              {item.productVariant.color || ""} × {item.quantity}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setModal({
                                orderId: order.id,
                                productId: product.id,
                                productName: product.name,
                              })
                            }
                            className="shrink-0 px-4 py-2 bg-chrome-100 text-black font-body text-xs tracking-wider font-medium hover:bg-chrome-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300"
                          >
                            Write Review
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── My reviews ── */}
      <section>
        <h2 className="font-display text-lg text-foreground mb-5">My Reviews</h2>

        {myReviews.length === 0 ? (
          <div className="border border-chrome-500 bg-surface p-6 text-center">
            <p className="font-body text-sm text-muted">You haven&apos;t written any reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myReviews.map((review) => (
              <div key={review.id} className="border border-chrome-500 bg-surface p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Stars rating={review.rating} />
                      <span className="font-body text-sm text-foreground font-medium">
                        {review.title || "Untitled"}
                      </span>
                      <span
                        className={`font-body text-[10px] uppercase tracking-wider px-2 py-0.5 border ${
                          STATUS_BADGE[review.status] || "border-chrome-500 text-muted"
                        }`}
                      >
                        {review.status}
                      </span>
                    </div>
                    <p className="font-body text-sm text-foreground mt-2 leading-relaxed">
                      {review.comment}
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      <Link
                        href={`/products/${review.product.slug}`}
                        className="font-body text-xs text-chrome-200 hover:text-foreground transition-colors"
                      >
                        {review.product.name} →
                      </Link>
                      <span className="font-body text-xs text-muted">
                        {review.order.orderNumber} · {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modal && (
        <ReviewModal
          orderId={modal.orderId}
          productId={modal.productId}
          productName={modal.productName}
          onClose={() => setModal(null)}
          onSubmitted={() => {
            setModal(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
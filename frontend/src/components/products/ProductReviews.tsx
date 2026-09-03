"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ProductReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: string;
  user: { id: string; name: string | null };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/products/${productId}/reviews`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load reviews");
        const data = await res.json();
        if (!cancelled) setReviews(data.data || []);
      } catch {
        // Non-blocking — reviews section simply stays empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) return null;

  const average =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <section className="product-detail-related">
      <h2 className="section-heading section-heading--sm">Customer Reviews</h2>
      <div className="section-divider section-divider--sm" />

      {reviews.length === 0 ? (
        <p className="font-body text-sm text-muted">
          No reviews yet. Have a delivered order? Share your experience from your
          account&apos;s Reviews page.
        </p>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3">
            <span className="font-display text-3xl text-foreground">{average}</span>
            <span className="inline-flex items-center gap-0.5" aria-label={`${average} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  strokeWidth={1.5}
                  className={
                    Math.round(Number(average)) >= star
                      ? "fill-chrome-100 text-chrome-100"
                      : "text-chrome-400"
                  }
                />
              ))}
            </span>
            <span className="font-body text-sm text-muted">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border border-chrome-500 bg-surface p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          strokeWidth={1.5}
                          className={
                            review.rating >= star
                              ? "fill-chrome-100 text-chrome-100"
                              : "text-chrome-400"
                          }
                        />
                      ))}
                    </span>
                    <span className="font-body text-sm text-foreground font-medium">
                      {review.user.name || "Verified Customer"}
                    </span>
                  </div>
                  <span className="font-body text-xs text-muted">
                    {formatDate(review.createdAt)}
                  </span>
                </div>

                {review.title && (
                  <p className="font-body text-sm text-foreground font-medium mt-3">
                    {review.title}
                  </p>
                )}
                <p className="font-body text-sm text-muted mt-1 leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReviewModalProps {
  orderId: string;
  productId: string;
  productName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

// ---------------------------------------------------------------------------
// ReviewModal — rating stars + title + comment, submitted for moderation
// ---------------------------------------------------------------------------

export default function ReviewModal({
  orderId,
  productId,
  productName,
  onClose,
  onSubmitted,
}: ReviewModalProps) {
  const accessToken = useAuthStore((s) => s.accessToken);

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Please select a star rating (1–5).");
      return;
    }
    if (!comment.trim()) {
      setError("Please write a short review.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId,
          orderId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit review.");
        return;
      }
      onSubmitted();
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Write a review"
        className="relative w-full max-w-lg bg-surface border border-chrome-500 shadow-xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-chrome-500">
          <h2 className="font-display text-lg text-foreground">Write a Review</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-foreground transition p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <p className="font-body text-sm text-foreground mb-1">{productName}</p>
            <p className="font-body text-xs text-muted">
              Your review will be published after moderation.
            </p>
          </div>

          {/* Star rating */}
          <div>
            <label className="block font-body text-xs uppercase tracking-wider text-muted mb-2">
              Rating
            </label>
            <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300"
                >
                  <Star
                    size={26}
                    strokeWidth={1.5}
                    className={
                      (hovered || rating) >= star
                        ? "fill-chrome-100 text-chrome-100"
                        : "text-chrome-400"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="review-title" className="block font-body text-xs uppercase tracking-wider text-muted mb-1.5">
              Title (optional)
            </label>
            <input
              id="review-title"
              type="text"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Excellent fabric and fit"
              className="checkout-float-input w-full"
            />
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="review-comment" className="block font-body text-xs uppercase tracking-wider text-muted mb-1.5">
              Review
            </label>
            <textarea
              id="review-comment"
              rows={4}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you thought of the product…"
              className="checkout-float-input w-full resize-none"
            />
            <p className="mt-1 text-right font-body text-[11px] text-muted">
              {comment.length}/500
            </p>
          </div>

          {error && (
            <p className="checkout-field-error" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="font-body text-sm text-muted hover:text-foreground transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-chrome-100 text-black font-body text-sm tracking-wider font-medium hover:bg-chrome-200 transition disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
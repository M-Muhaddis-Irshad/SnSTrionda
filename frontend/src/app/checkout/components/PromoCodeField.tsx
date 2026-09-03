"use client";

import { useState } from "react";
import { API_URL } from "@/lib/checkout";
import { useCheckoutStore } from "@/stores/checkoutStore";

interface PromoCodeFieldProps {
  id?: string;
}

export default function PromoCodeField({ id = "promo-code" }: PromoCodeFieldProps) {
  const { promoCode, discountPercent, applyPromo, clearPromo } = useCheckoutStore();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    const code = input.trim();
    if (!code) {
      setError("Enter a promo code first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/api/orders/promo/validate?code=${encodeURIComponent(code)}`
      );
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.message || "Invalid or expired promo code.");
        return;
      }

      applyPromo(data.code || code.toUpperCase(), data.discountPercent);
      setInput("");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Applied state
  if (promoCode && discountPercent) {
    return (
      <div>
        <div className="checkout-promo-applied">
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-chrome-100" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="font-body text-sm text-foreground">
                {promoCode} — {discountPercent}% off subtotal
              </p>
              <p className="font-body text-[11px] text-muted">
                Discount applied to your order summary.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearPromo}
            className="font-body text-xs text-chrome-300 underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 rounded-sm transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} noValidate>
      <div className="flex gap-3">
        <label htmlFor={id} className="sr-only">
          Promo code
        </label>
        <input
          id={id}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError("");
          }}
          placeholder="e.g. TRIONDA10"
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`flex-1 rounded-none border bg-surface px-4 py-3 text-sm text-foreground
            placeholder:text-chrome-400 focus:outline-none focus:border-chrome-200
            focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2
            focus-visible:ring-offset-background transition-colors
            ${error ? "border-red-500" : "border-chrome-500"}`}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn--primary btn--sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Checking..." : "Apply"}
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className="checkout-field-error" role="alert">
          {error}
        </p>
      )}
      {!error && (
        <p className="mt-2 font-body text-xs text-muted">
          Try <span className="text-chrome-200">TRIONDA10</span> (10% off) or{" "}
          <span className="text-chrome-200">TRIONDA20</span> (20% off).
        </p>
      )}
    </form>
  );
}

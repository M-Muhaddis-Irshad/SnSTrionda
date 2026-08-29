"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, selectSubtotal } from "@/stores/cartStore";
import Button from "@/components/ui/Button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShippingForm {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  email: string;
}

type PaymentMethod = "JAZZCASH" | "EASYPAISA" | "COD" | "CARD";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHIPPING_COST = 200;

const INITIAL_FORM: ShippingForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  province: "",
  postalCode: "",
  email: "",
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string; note: string }[] = [
  { value: "CARD", label: "Card Payment", note: "Pay securely with credit/debit card via Safepay" },
  { value: "COD", label: "Cash on Delivery", note: "Pay when your order arrives" },
  { value: "JAZZCASH", label: "JazzCash", note: "Payment gateway coming soon" },
  { value: "EASYPAISA", label: "Easypaisa", note: "Payment gateway coming soon" },
];

// ---------------------------------------------------------------------------
// Format price
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

// ---------------------------------------------------------------------------
// CheckoutPage Component
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore(selectSubtotal);
  const clearCart = useCartStore((state) => state.clearCart);

  const [form, setForm] = useState<ShippingForm>(INITIAL_FORM);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const total = subtotal + SHIPPING_COST;

  // Empty cart state
  if (items.length === 0 && status === "idle") {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <h1 className="font-display text-3xl tracking-[0.1em] text-foreground">
            Checkout
          </h1>
          <div className="mt-3 h-px w-16 bg-chrome-400 mx-auto" />
          <p className="mt-8 font-body text-muted">
            Your cart is empty. Add some items before checking out.
          </p>
          <a
            href="/shop"
            className="mt-6 inline-block font-body text-sm tracking-wider text-muted underline transition-colors hover:text-foreground"
          >
            Continue Shopping
          </a>
        </div>
      </main>
    );
  }

  function handleChange(field: keyof ShippingForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  }

  function validate(): string | null {
    if (!form.fullName.trim()) return "Full name is required.";
    if (!form.phone.trim()) return "Phone number is required.";
    if (!form.addressLine1.trim()) return "Address line 1 is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.province.trim()) return "Province is required.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setStatus("error");
      setErrorMessage(validationError);
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          customMeasurementId: item.customMeasurementId || null,
        })),
        shippingAddress: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim() || undefined,
          city: form.city.trim(),
          province: form.province.trim(),
          postalCode: form.postalCode.trim() || undefined,
          country: "Pakistan",
        },
        paymentMethod,
        email: form.email.trim() || undefined,
      };

      const res = await fetch(`${apiUrl}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Failed to place order.");
        return;
      }

      // For card payments: create Safepay session and redirect to hosted checkout
      if (paymentMethod === "CARD") {
        try {
          const paymentRes = await fetch(`${apiUrl}/api/payments/safepay/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.data.id }),
          });

          const paymentData = await paymentRes.json();

          if (!paymentRes.ok) {
            setStatus("error");
            setErrorMessage(
              paymentData.error || "Failed to initiate card payment. Your order has been placed — please contact support."
            );
            // Still redirect to confirmation even if payment session fails
            // so user can see their pending order
            router.push(`/order-confirmation/${data.data.orderNumber}`);
            return;
          }

          // Clear cart and redirect to Safepay hosted checkout
          clearCart();
          window.location.href = paymentData.data.checkoutUrl;
          return;
        } catch {
          setStatus("error");
          setErrorMessage(
            "Could not connect to payment service. Your order has been placed — please contact support."
          );
          router.push(`/order-confirmation/${data.data.orderNumber}`);
          return;
        }
      }

      // Non-card payments: clear cart and redirect to confirmation
      clearCart();
      router.push(`/order-confirmation/${data.data.orderNumber}`);
    } catch {
      setStatus("error");
      setErrorMessage("Could not connect to the server. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Page heading */}
        <h1 className="font-display text-3xl tracking-[0.1em] text-foreground">
          Checkout
        </h1>
        <div className="mt-3 h-px w-16 bg-chrome-400" />

        <form onSubmit={handleSubmit} className="mt-10 space-y-10">
          {/* Shipping Address */}
          <fieldset>
            <legend className="font-display text-lg tracking-wider text-foreground mb-6">
              Shipping Address
            </legend>

            <div className="space-y-4">
              {/* Email (optional — for order updates) */}
              <div>
                <label className="block font-body text-xs text-muted mb-1">
                  Email (for order updates)
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full border border-chrome-500 bg-transparent px-3 py-2 font-body text-sm text-foreground placeholder-chrome-400 focus:border-chrome-300 focus:outline-none transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-body text-xs text-muted mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="w-full border border-chrome-500 bg-transparent px-3 py-2 font-body text-sm text-foreground placeholder-chrome-400 focus:border-chrome-300 focus:outline-none transition-colors"
                    placeholder="Ahmed Khan"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs text-muted mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full border border-chrome-500 bg-transparent px-3 py-2 font-body text-sm text-foreground placeholder-chrome-400 focus:border-chrome-300 focus:outline-none transition-colors"
                    placeholder="03001234567"
                  />
                </div>
              </div>

              <div>
                <label className="block font-body text-xs text-muted mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={form.addressLine1}
                  onChange={(e) => handleChange("addressLine1", e.target.value)}
                  className="w-full border border-chrome-500 bg-transparent px-3 py-2 font-body text-sm text-foreground placeholder-chrome-400 focus:border-chrome-300 focus:outline-none transition-colors"
                  placeholder="123 Main Street"
                />
              </div>

              <div>
                <label className="block font-body text-xs text-muted mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={form.addressLine2}
                  onChange={(e) => handleChange("addressLine2", e.target.value)}
                  className="w-full border border-chrome-500 bg-transparent px-3 py-2 font-body text-sm text-foreground placeholder-chrome-400 focus:border-chrome-300 focus:outline-none transition-colors"
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs text-muted mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className="w-full border border-chrome-500 bg-transparent px-3 py-2 font-body text-sm text-foreground placeholder-chrome-400 focus:border-chrome-300 focus:outline-none transition-colors"
                    placeholder="Lahore"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs text-muted mb-1">
                    Province *
                  </label>
                  <input
                    type="text"
                    value={form.province}
                    onChange={(e) => handleChange("province", e.target.value)}
                    className="w-full border border-chrome-500 bg-transparent px-3 py-2 font-body text-sm text-foreground placeholder-chrome-400 focus:border-chrome-300 focus:outline-none transition-colors"
                    placeholder="Punjab"
                  />
                </div>
              </div>

              <div className="w-1/2">
                <label className="block font-body text-xs text-muted mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  className="w-full border border-chrome-500 bg-transparent px-3 py-2 font-body text-sm text-foreground placeholder-chrome-400 focus:border-chrome-300 focus:outline-none transition-colors"
                  placeholder="54000"
                />
              </div>
            </div>
          </fieldset>

          {/* Payment Method */}
          <fieldset>
            <legend className="font-display text-lg tracking-wider text-foreground mb-6">
              Payment Method
            </legend>

            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-4 border p-4 cursor-pointer transition-all duration-200 ${
                    paymentMethod === method.value
                      ? "border-chrome-200 bg-chrome-500"
                      : "border-chrome-500 hover:border-chrome-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      paymentMethod === method.value
                        ? "border-chrome-200"
                        : "border-chrome-400"
                    }`}
                  >
                    {paymentMethod === method.value && (
                      <div className="h-2 w-2 rounded-full bg-chrome-200" />
                    )}
                  </div>
                  <div>
                    <p className="font-body text-sm text-foreground">{method.label}</p>
                    <p className="font-body text-xs text-muted">{method.note}</p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Order Summary */}
          <fieldset>
            <legend className="font-display text-lg tracking-wider text-foreground mb-6">
              Order Summary
            </legend>

            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-foreground truncate">
                      {item.productName}
                    </p>
                    <p className="font-body text-xs text-muted">
                      {item.variantLabel} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-body text-sm text-foreground ml-4">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}

              <div className="border-t border-chrome-500 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-body text-sm text-muted">Subtotal</span>
                  <span className="font-body text-sm text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-body text-sm text-muted">Shipping</span>
                  <span className="font-body text-sm text-foreground">{formatPrice(SHIPPING_COST)}</span>
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-chrome-500">
                  <span className="font-body text-sm text-foreground font-medium">Total</span>
                  <span className="font-display text-lg tracking-wide text-foreground">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Error */}
          {status === "error" && (
            <p className="font-body text-sm text-red-400">{errorMessage}</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Placing Order..." : `Place Order — ${formatPrice(total)}`}
          </Button>
        </form>
      </div>
    </main>
  );
}

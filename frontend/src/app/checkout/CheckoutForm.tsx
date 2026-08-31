"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, selectSubtotal } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShippingForm {
  email: string;
  country: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
}

type PaymentMethod = "CARD" | "COD";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHIPPING_COST = 200;

const INITIAL_FORM: ShippingForm = {
  email: "",
  country: "Pakistan",
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  province: "",
  postalCode: "",
  phone: "",
};

// ---------------------------------------------------------------------------
// Format price
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

// ---------------------------------------------------------------------------
// CheckoutForm Component
// ---------------------------------------------------------------------------

export default function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore(selectSubtotal);
  const clearCart = useCartStore((state) => state.clearCart);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [form, setForm] = useState<ShippingForm>(INITIAL_FORM);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [loadingStep, setLoadingStep] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const total = subtotal + SHIPPING_COST;

  function handleChange(field: keyof ShippingForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  }

  function validate(): string | null {
    if (!form.firstName.trim()) return "First name is required.";
    if (!form.lastName.trim()) return "Last name is required.";
    if (!form.address.trim()) return "Address is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.province.trim()) return "Province is required.";
    if (!form.phone.trim()) return "Phone number is required.";
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
    setLoadingStep("Placing your order...");
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
          fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
          phone: form.phone.trim(),
          addressLine1: form.address.trim(),
          addressLine2: form.apartment.trim() || undefined,
          city: form.city.trim(),
          province: form.province.trim(),
          postalCode: form.postalCode.trim() || undefined,
          country: form.country,
        },
        paymentMethod,
        email: form.email.trim() || undefined,
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`${apiUrl}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Failed to place order.");
        return;
      }

      // Store email for order confirmation page's email verification
      if (form.email.trim()) {
        localStorage.setItem(`trionda-order-email-${data.data.orderNumber}`, form.email.trim());
      }

      // For card payments: create Safepay session and redirect to hosted checkout
      if (paymentMethod === "CARD") {
        setLoadingStep("Redirecting to payment...");
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
            router.push(`/order-confirmation/${data.data.orderNumber}`);
            return;
          }

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
      setLoadingStep("Order placed! Redirecting...");
      clearCart();
      router.push(`/order-confirmation/${data.data.orderNumber}`);
    } catch {
      setStatus("error");
      setErrorMessage("Could not connect to the server. Please try again.");
    }
  }

  // Shipping options are only shown after address is filled
  const hasAddress = form.address.trim() && form.city.trim() && form.province.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Contact ── */}
      <section>
        <h2 className="font-display text-lg tracking-wider text-foreground mb-4">
          Contact
        </h2>
        <div className="space-y-3">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="Email for order updates"
          />
          <p className="font-body text-xs text-muted">
            Already have an account?{" "}
            <a href="/login" className="text-chrome-200 underline hover:text-foreground transition-colors">
              Sign in
            </a>
          </p>
        </div>
      </section>

      {/* ── Delivery ── */}
      <section>
        <h2 className="font-display text-lg tracking-wider text-foreground mb-4">
          Delivery
        </h2>
        <div className="space-y-3">
          {/* Country */}
          <div>
            <label className="block font-body text-xs text-muted mb-1">
              Country / Region
            </label>
            <select
              value={form.country}
              onChange={(e) => handleChange("country", e.target.value)}
              className="w-full bg-surface border border-chrome-500 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-chrome-300 focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
            >
              <option value="Pakistan">Pakistan</option>
            </select>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-body text-xs text-muted mb-1">
                First name *
              </label>
              <Input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="Ahmed"
                required
              />
            </div>
            <div>
              <label className="block font-body text-xs text-muted mb-1">
                Last name *
              </label>
              <Input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Khan"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block font-body text-xs text-muted mb-1">
              Address *
            </label>
            <Input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="123 Main Street"
              required
            />
          </div>

          {/* Apartment */}
          <div>
            <label className="block font-body text-xs text-muted mb-1">
              Apartment, suite, etc.
            </label>
            <Input
              type="text"
              value={form.apartment}
              onChange={(e) => handleChange("apartment", e.target.value)}
              placeholder="Apt 4B"
            />
          </div>

          {/* City / Province / Postal */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block font-body text-xs text-muted mb-1">
                City *
              </label>
              <Input
                type="text"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Lahore"
                required
              />
            </div>
            <div>
              <label className="block font-body text-xs text-muted mb-1">
                Province *
              </label>
              <Input
                type="text"
                value={form.province}
                onChange={(e) => handleChange("province", e.target.value)}
                placeholder="Punjab"
                required
              />
            </div>
            <div>
              <label className="block font-body text-xs text-muted mb-1">
                Postal code
              </label>
              <Input
                type="text"
                value={form.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
                placeholder="54000"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block font-body text-xs text-muted mb-1">
              Phone *
            </label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="03001234567"
              required
            />
          </div>
        </div>
      </section>

      {/* ── Shipping method ── */}
      <section>
        <h2 className="font-display text-lg tracking-wider text-foreground mb-4">
          Shipping method
        </h2>
        {!hasAddress ? (
          <p className="font-body text-sm text-muted border border-chrome-500 p-4">
            Enter your address to see shipping options.
          </p>
        ) : (
          <div className="border border-chrome-300 p-4 flex items-center justify-between">
            <div>
              <p className="font-body text-sm text-foreground">Standard shipping</p>
              <p className="font-body text-xs text-muted">3–5 business days</p>
            </div>
            <span className="font-body text-sm text-foreground font-medium">
              {formatPrice(SHIPPING_COST)}
            </span>
          </div>
        )}
      </section>

      {/* ── Payment ── */}
      <section>
        <h2 className="font-display text-lg tracking-wider text-foreground mb-4">
          Payment
        </h2>
        <div className="space-y-3">
          {/* Card */}
          <label
            className={`flex items-center gap-4 border p-4 cursor-pointer transition-all duration-200 ${
              paymentMethod === "CARD"
                ? "border-chrome-200 bg-chrome-500"
                : "border-chrome-500 hover:border-chrome-400"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="CARD"
              checked={paymentMethod === "CARD"}
              onChange={() => setPaymentMethod("CARD")}
              className="sr-only"
            />
            <div
              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                paymentMethod === "CARD" ? "border-chrome-200" : "border-chrome-400"
              }`}
            >
              {paymentMethod === "CARD" && (
                <div className="h-2 w-2 rounded-full bg-chrome-200" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-body text-sm text-foreground">Credit / Debit Card</p>
              <p className="font-body text-xs text-muted">
                Pay securely via Safepay
              </p>
            </div>
            {paymentMethod === "CARD" && (
              <Badge variant="outline">Selected</Badge>
            )}
          </label>

          {/* COD */}
          <label
            className={`flex items-center gap-4 border p-4 cursor-pointer transition-all duration-200 ${
              paymentMethod === "COD"
                ? "border-chrome-200 bg-chrome-500"
                : "border-chrome-500 hover:border-chrome-400"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={paymentMethod === "COD"}
              onChange={() => setPaymentMethod("COD")}
              className="sr-only"
            />
            <div
              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                paymentMethod === "COD" ? "border-chrome-200" : "border-chrome-400"
              }`}
            >
              {paymentMethod === "COD" && (
                <div className="h-2 w-2 rounded-full bg-chrome-200" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-body text-sm text-foreground">Cash on Delivery</p>
              <p className="font-body text-xs text-muted">
                Pay when your order arrives
              </p>
            </div>
            {paymentMethod === "COD" && (
              <Badge variant="outline">Selected</Badge>
            )}
          </label>
        </div>
      </section>

      {/* Error */}
      {status === "error" && (
        <p className="font-body text-sm text-red-400">{errorMessage}</p>
      )}

      {/* Loading progress */}
      {status === "loading" && (
        <div className="flex items-center gap-3 p-4 border border-chrome-500 bg-surface">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-chrome-400 border-t-transparent" />
          <span className="font-body text-sm text-muted">{loadingStep}</span>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Processing..." : "Complete order"}
      </Button>
    </form>
  );
}

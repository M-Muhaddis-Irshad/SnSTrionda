"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

      if (form.email.trim()) {
        localStorage.setItem(`trionda-order-email-${data.data.orderNumber}`, form.email.trim());
      }

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

      setLoadingStep("Order placed! Redirecting...");
      clearCart();
      router.push(`/order-confirmation/${data.data.orderNumber}`);
    } catch {
      setStatus("error");
      setErrorMessage("Could not connect to the server. Please try again.");
    }
  }

  const hasAddress = form.address.trim() && form.city.trim() && form.province.trim();

  return (
    <form onSubmit={handleSubmit} className="checkout-section">
      {/* Contact */}
      <section>
        <h2 className="checkout-section-title">Contact</h2>
        <div className="checkout-fields">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="Email for order updates"
          />
          <p className="checkout-hint">
            Already have an account?{" "}
            <Link href="/login">Sign in</Link>
          </p>
        </div>
      </section>

      {/* Delivery */}
      <section>
        <h2 className="checkout-section-title">Delivery</h2>
        <div className="checkout-fields">
          <div>
            <label className="checkout-label">Country / Region</label>
            <select
              value={form.country}
              onChange={(e) => handleChange("country", e.target.value)}
              className="checkout-select"
            >
              <option value="Pakistan">Pakistan</option>
            </select>
          </div>

          <div className="checkout-name-row">
            <div>
              <label className="checkout-label">First name *</label>
              <Input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="Ahmed"
                required
              />
            </div>
            <div>
              <label className="checkout-label">Last name *</label>
              <Input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Khan"
                required
              />
            </div>
          </div>

          <div>
            <label className="checkout-label">Address *</label>
            <Input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="123 Main Street"
              required
            />
          </div>

          <div>
            <label className="checkout-label">Apartment, suite, etc.</label>
            <Input
              type="text"
              value={form.apartment}
              onChange={(e) => handleChange("apartment", e.target.value)}
              placeholder="Apt 4B"
            />
          </div>

          <div className="checkout-address-row">
            <div className="checkout-address-row-first">
              <label className="checkout-label">City *</label>
              <Input
                type="text"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Lahore"
                required
              />
            </div>
            <div>
              <label className="checkout-label">Province *</label>
              <Input
                type="text"
                value={form.province}
                onChange={(e) => handleChange("province", e.target.value)}
                placeholder="Punjab"
                required
              />
            </div>
            <div>
              <label className="checkout-label">Postal code</label>
              <Input
                type="text"
                value={form.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
                placeholder="54000"
              />
            </div>
          </div>

          <div>
            <label className="checkout-label">Phone *</label>
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

      {/* Shipping method */}
      <section>
        <h2 className="checkout-section-title">Shipping method</h2>
        {!hasAddress ? (
          <p className="checkout-shipping-empty">
            Enter your address to see shipping options.
          </p>
        ) : (
          <div className="checkout-shipping-option">
            <div>
              <p className="checkout-shipping-name">Standard shipping</p>
              <p className="checkout-shipping-time">3–5 business days</p>
            </div>
            <span className="checkout-shipping-price">
              {formatPrice(SHIPPING_COST)}
            </span>
          </div>
        )}
      </section>

      {/* Payment */}
      <section>
        <h2 className="checkout-section-title">Payment</h2>
        <div className="space-y-3">
          {/* Card */}
          <label
            className={`checkout-payment-label ${
              paymentMethod === "CARD"
                ? "checkout-payment-label--selected"
                : "checkout-payment-label--unselected"
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
            <div className={`checkout-radio-dot ${paymentMethod === "CARD" ? "checkout-radio-dot--selected" : "checkout-radio-dot--unselected"}`}>
              {paymentMethod === "CARD" && <div className="checkout-radio-fill" />}
            </div>
            <div className="flex-1">
              <p className="checkout-payment-name">Credit / Debit Card</p>
              <p className="checkout-payment-desc">Pay securely via Safepay</p>
            </div>
            {paymentMethod === "CARD" && <Badge variant="outline">Selected</Badge>}
          </label>

          {/* COD */}
          <label
            className={`checkout-payment-label ${
              paymentMethod === "COD"
                ? "checkout-payment-label--selected"
                : "checkout-payment-label--unselected"
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
            <div className={`checkout-radio-dot ${paymentMethod === "COD" ? "checkout-radio-dot--selected" : "checkout-radio-dot--unselected"}`}>
              {paymentMethod === "COD" && <div className="checkout-radio-fill" />}
            </div>
            <div className="flex-1">
              <p className="checkout-payment-name">Cash on Delivery</p>
              <p className="checkout-payment-desc">Pay when your order arrives</p>
            </div>
            {paymentMethod === "COD" && <Badge variant="outline">Selected</Badge>}
          </label>
        </div>
      </section>

      {/* Error */}
      {status === "error" && (
        <p className="checkout-error">{errorMessage}</p>
      )}

      {/* Loading progress */}
      {status === "loading" && (
        <div className="checkout-loading">
          <div className="checkout-loading-spinner" />
          <span className="checkout-loading-text">{loadingStep}</span>
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

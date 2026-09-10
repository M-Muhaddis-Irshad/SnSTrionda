"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore, selectSubtotal } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useCheckoutStore } from "@/stores/checkoutStore";
import Button from "@/components/ui/Button";
import LoginModal from "@/components/ui/LoginModal";
import Badge from "@/components/ui/Badge";
import {
  SHIPPING_COST,
  API_URL,
  formatPrice,
  computeTotals,
  isValidEmail,
  isValidPhone,
  isValidPostalCode,
} from "@/lib/checkout";
import StepIndicator from "./components/StepIndicator";
import FormStep from "./components/FormStep";
import Field from "./components/Field";
import PromoCodeField from "./components/PromoCodeField";
import CitySelector from "./components/CitySelector";
import OrderSummaryPanel from "./OrderSummaryPanel";
import type { DeliveryZone } from "@/types/delivery";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type PaymentMethod = "COD" | "JAZZCASH";

interface CheckoutFormData {
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

const STEPS = [
  { id: "contact", label: "Contact" },
  { id: "shipping", label: "Shipping" },
  { id: "promo", label: "Promo" },
  { id: "method", label: "Shipping method" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Review" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const INITIAL_FORM: CheckoutFormData = {
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

type ErrorsMap = Record<string, string>;

// ---------------------------------------------------------------------------
// Per-step validation
// ---------------------------------------------------------------------------

function validateStep(stepId: StepId, form: CheckoutFormData): ErrorsMap {
  const errors: ErrorsMap = {};

  if (stepId === "contact") {
    if (!form.email.trim()) {
      errors.email = "Email is required for order updates.";
    } else if (!isValidEmail(form.email)) {
      errors.email = "Enter a valid email address.";
    }
  }

  if (stepId === "shipping") {
    if (!form.firstName.trim()) errors.firstName = "First name is required.";
    if (!form.lastName.trim()) errors.lastName = "Last name is required.";
    if (!form.address.trim()) errors.address = "Street address is required.";
    if (!form.city.trim()) errors.city = "City is required.";
    if (!form.province.trim()) errors.province = "Province is required.";
    if (!form.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!isValidPhone(form.phone)) {
      errors.phone = "Enter a valid Pakistan phone number (e.g. 03001234567).";
    }
    if (form.postalCode.trim() && !isValidPostalCode(form.postalCode)) {
      errors.postalCode = "Postal code must be 5 digits (e.g. 54000).";
    }
  }

  return errors;
}

function fieldForStep(stepId: StepId): string[] {
  return Object.keys(validateStep(stepId, INITIAL_FORM));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore(selectSubtotal);
  const clearCart = useCartStore((state) => state.clearCart);
  const authUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Show login modal for guests on checkout
  useEffect(() => {
    if (authUser === undefined) return; // still hydrating
    if (!authUser) setShowAuthModal(true);
  }, [authUser]);
  const { promoCode, discountPercent, discountAmount, resetCheckout, clearCheckout } =
    useCheckoutStore();

  const [form, setForm] = useState<CheckoutFormData>(INITIAL_FORM);
  const [stepIndex, setStepIndex] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [errors, setErrors] = useState<ErrorsMap>({});
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [jazzcashSettings, setJazzcashSettings] = useState<Record<string, string>>({});

  // Delivery zones (Pakistan cities with charges + map)
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);

  // Submit states
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [loadingStep, setLoadingStep] = useState("");
  const [serverError, setServerError] = useState("");

  const stepRef = useRef<HTMLDivElement | null>(null);

  const deliveryCharges = selectedZone?.deliveryCharges ?? SHIPPING_COST;

  const totals = useMemo(
    () => computeTotals(subtotal, discountPercent, deliveryCharges),
    [subtotal, discountPercent, deliveryCharges]
  );

  // -------------------------------------------------------------------------
  // Fresh session — clear any promo / stale draft from a previous visit.
  // The form is never pre-filled from localStorage, so a phone number the
  // user didn't type can never appear on the payment step.
  // -------------------------------------------------------------------------

  useEffect(() => {
    resetCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Signed-in users see their account email pre-filled on the contact step
  // (asked otherwise). Re-runs when auth hydrates or the user changes, but
  // never overwrites something the visitor already typed.
  useEffect(() => {
    if (!authUser?.email) return;
    setForm((prev) => (prev.email.trim() ? prev : { ...prev, email: authUser.email }));
  }, [authUser?.email]);

  // Load JazzCash account details when that payment method is selected
  useEffect(() => {
    if (paymentMethod !== "JAZZCASH") return;
    if (jazzcashSettings.jazzcash_account_name) return; // already loaded
    let cancelled = false;
    fetch(`${API_URL}/api/settings`)
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled && res.data) setJazzcashSettings(res.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [paymentMethod, jazzcashSettings.jazzcash_account_name]);

  // -------------------------------------------------------------------------
  // Load delivery zones (city dropdown + map)
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    async function loadZones() {
      try {
        const res = await fetch(`${API_URL}/api/delivery-zones`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load delivery zones");
        const data = await res.json();
        if (!cancelled) setZones(data.data || []);
      } catch {
        // Non-blocking — checkout works with the flat shipping rate
      } finally {
        if (!cancelled) setZonesLoading(false);
      }
    }
    loadZones();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Field change / blur handlers
  // -------------------------------------------------------------------------

  function handleChange(field: keyof CheckoutFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear this field's error while the user corrects it
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }

  function handleBlur(field: keyof CheckoutFormData) {
    // Validate the blurred field once (only if non-empty or required)
    const currentId = STEPS[stepIndex].id as StepId;
    const single = validateStep(currentId, form)[field];
    setErrors((prev) => {
      const copy = { ...prev };
      if (single) {
        copy[field] = single;
      } else {
        delete copy[field];
      }
      return copy;
    });
  }

  function fieldError(field: string): string | undefined {
    return errors[field];
  }

  // -------------------------------------------------------------------------
  // Step navigation
  // -------------------------------------------------------------------------

  function goToStep(index: number) {
    setStepIndex(index);
    setMaxReached((m) => Math.max(m, index));
    setErrors({});
    requestAnimationFrame(() => {
      stepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleNext() {
    const currentId = STEPS[stepIndex].id as StepId;
    if (currentId === "review") return;

    // Shipping-method step requires a selection (defaults to standard)
    if (currentId === "method" && !shippingMethod) {
      setErrors({ shippingMethod: "Choose a shipping method." });
      return;
    }
    if (currentId === "payment" && !paymentMethod) {
      setErrors({ paymentMethod: "Choose a payment method." });
      return;
    }

    const validation = validateStep(currentId, form);
    const currentFields = fieldForStep(currentId);
    const stepErrors: ErrorsMap = {};
    for (const f of currentFields) {
      if (validation[f]) stepErrors[f] = validation[f];
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    goToStep(Math.min(stepIndex + 1, STEPS.length - 1));
  }

  // -------------------------------------------------------------------------
  // Place order
  // -------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Guard: re-validate contact + shipping before placing
    const allErrors = {
      ...validateStep("contact", form),
      ...validateStep("shipping", form),
    };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setStepIndex(0);
      requestAnimationFrame(() => {
        stepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }

    if (items.length === 0) {
      setServerError("Your cart is empty. Please add items before checking out.");
      return;
    }

    setStatus("loading");
    setLoadingStep("Placing your order...");
    setServerError("");

    try {
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
        email: form.email.trim(),
        promoCode: promoCode || undefined,
        deliveryZoneId: selectedZone?.id || undefined,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setServerError(data.error || "Failed to place order.");
        return;
      }

      localStorage.setItem(
        `trionda-order-email-${data.data.orderNumber}`,
        form.email.trim()
      );
      // Purge promo + any persisted draft so the next checkout starts clean.
      clearCheckout();

      setLoadingStep("Order placed! Redirecting...");
      clearCart();
      router.push(`/order-confirmation/${data.data.orderNumber}`);
    } catch {
      setStatus("error");
      setServerError("Could not connect to the server. Please try again.");
    }
  }

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const deliveryLabel = `${form.firstName.trim()} ${form.lastName.trim()}${
    form.address.trim()
      ? `, ${form.address.trim()}${form.apartment.trim() ? `, ${form.apartment.trim()}` : ""}, ${form.city.trim()}, ${form.province.trim()}${
          form.postalCode.trim() ? ` ${form.postalCode.trim()}` : ""
        }`
      : ""
  }`;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-[0.1em] text-foreground">
              Checkout
            </h1>
            <p className="mt-2 font-body text-sm text-muted">
              {items.length} {items.length === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          {authUser?.email && (
            <p className="hidden font-body text-xs text-muted sm:block">
              Signed in as <span className="text-chrome-200">{authUser.email}</span>
            </p>
          )}
        </div>
        <div className="mt-3 h-px w-16 bg-chrome-400" />

        {/* Sticky progress indicator */}
        <div className="mt-6">
          <StepIndicator
            steps={STEPS}
            currentIndex={stepIndex}
            maxReached={maxReached}
            onNavigate={goToStep}
          />
        </div>

        {items.length === 0 ? (
          <div className="border border-chrome-500 p-10 text-center mt-8">
            <p className="font-body text-muted mb-6">Your cart is empty.</p>
            <Button as="a" href="/shop" variant="primary">
              Continue shopping
            </Button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col lg:flex-row gap-10 lg:gap-12">
            {/* Left column — form (first on mobile so summary sits below) */}
            <div ref={stepRef} className="flex-1 min-w-0 scroll-mt-16">
              <form onSubmit={handleSubmit} noValidate>
                {/* ── STEP 1 · CONTACT ── */}
                {stepIndex === 0 && (
                  <FormStep stepNumber={1} title="Contact" subtitle="Where should we send order updates?">
                    <div className="checkout-fields">
                      <Field
                        id="email"
                        label="Email address"
                        type="email"
                        inputMode="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={(v) => handleChange("email", v)}
                        onBlur={() => handleBlur("email")}
                        error={fieldError("email")}
                        hint={
                          <span>
                            Already have an account?{" "}
                            <Link href="/login" className="text-chrome-200 underline hover:text-foreground transition-colors">
                              Sign in
                            </Link>{" "}
                            to speed this up.
                          </span>
                        }
                      />
                    </div>
                  </FormStep>
                )}

                {/* ── STEP 2 · SHIPPING ── */}
                {stepIndex === 1 && (
                  <FormStep stepNumber={2} title="Shipping address">
                    <div className="checkout-fields">
                      <Field
                        id="country"
                        label="Country / Region"
                        value={form.country}
                        onChange={(v) => handleChange("country", v)}
                        selectOptions={[{ value: "Pakistan", label: "Pakistan" }]}
                      />
                      <CitySelector
                        zones={zones}
                        selectedZoneId={selectedZone?.id || null}
                        loading={zonesLoading}
                        onSelect={(zone) => {
                          setSelectedZone(zone);
                          if (zone) {
                            // Prefill the city + province from the chosen zone
                            setForm((prev) => ({
                              ...prev,
                              city: prev.city.trim() ? prev.city : zone.name,
                              province: prev.province.trim() ? prev.province : "",
                            }));
                          }
                        }}
                      />
                      <div className="checkout-name-row">
                        <Field
                          id="firstName"
                          label="First name"
                          required
                          autoComplete="given-name"
                          value={form.firstName}
                          onChange={(v) => handleChange("firstName", v)}
                          onBlur={() => handleBlur("firstName")}
                          error={fieldError("firstName")}
                        />
                        <Field
                          id="lastName"
                          label="Last name"
                          required
                          autoComplete="family-name"
                          value={form.lastName}
                          onChange={(v) => handleChange("lastName", v)}
                          onBlur={() => handleBlur("lastName")}
                          error={fieldError("lastName")}
                        />
                      </div>
                      <Field
                        id="address"
                        label="Street address"
                        required
                        autoComplete="address-line1"
                        value={form.address}
                        onChange={(v) => handleChange("address", v)}
                        onBlur={() => handleBlur("address")}
                        error={fieldError("address")}
                      />
                      <Field
                        id="apartment"
                        label="Apartment, suite, etc. (optional)"
                        autoComplete="address-line2"
                        value={form.apartment}
                        onChange={(v) => handleChange("apartment", v)}
                      />
                      <div className="checkout-address-row">
                        <div className="checkout-address-row-first">
                          <Field
                            id="city"
                            label="City"
                            required
                            autoComplete="address-level2"
                            value={form.city}
                            onChange={(v) => handleChange("city", v)}
                            onBlur={() => handleBlur("city")}
                            error={fieldError("city")}
                          />
                        </div>
                        <Field
                          id="province"
                          label="Province"
                          required
                          autoComplete="address-level1"
                          value={form.province}
                          onChange={(v) => handleChange("province", v)}
                          onBlur={() => handleBlur("province")}
                          error={fieldError("province")}
                        />
                        <Field
                          id="postalCode"
                          label="Postal code (optional)"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          value={form.postalCode}
                          onChange={(v) => handleChange("postalCode", v)}
                          onBlur={() => handleBlur("postalCode")}
                          error={fieldError("postalCode")}
                        />
                      </div>
                      <Field
                        id="phone"
                        label="Phone number"
                        type="tel"
                        inputMode="tel"
                        required
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(v) => handleChange("phone", v)}
                        onBlur={() => handleBlur("phone")}
                        error={fieldError("phone")}
                        hint="Delivery agents may call this number."
                      />
                    </div>
                  </FormStep>
                )}

                {/* ── STEP 3 · PROMO ── */}
                {stepIndex === 2 && (
                  <FormStep
                    stepNumber={3}
                    title="Promo code"
                    subtitle="Have a promo code? Apply it here before you pay."
                  >
                    <PromoCodeField />
                    {discountPercent ? (
                      <p className="mt-3 font-body text-xs text-muted">
                        You're saving{" "}
                        <span className="text-chrome-200">{formatPrice(totals.discount)}</span>{" "}
                        on this order.
                      </p>
                    ) : null}
                  </FormStep>
                )}

                {/* ── STEP 4 · SHIPPING METHOD ── */}
                {stepIndex === 3 && (
                  <FormStep stepNumber={4} title="Shipping method">
                    <div className="space-y-3">
                      <ShippingMethodCard
                        title="Standard shipping"
                        time={
                          selectedZone
                            ? `Estimated ${selectedZone.estimatedDays <= 1 ? "1 day" : `${selectedZone.estimatedDays - 1}–${selectedZone.estimatedDays} days`} to ${selectedZone.name}`
                            : "3–5 business days"
                        }
                        price={deliveryCharges}
                        selected={shippingMethod === "standard"}
                        onSelect={() => setShippingMethod("standard")}
                      />
                      {errors.shippingMethod && (
                        <p className="checkout-field-error" role="alert">
                          {errors.shippingMethod}
                        </p>
                      )}
                      <p className="font-body text-xs text-muted">
                        {selectedZone
                          ? `Delivery charges are based on your selected city (${selectedZone.name}).`
                          : "Select your city in the shipping step to see exact delivery charges."}
                      </p>
                    </div>
                  </FormStep>
                )}

                {/* ── STEP 5 · PAYMENT ── */}
                {stepIndex === 4 && (
                  <FormStep stepNumber={5} title="Payment" subtitle="How would you like to pay?">
                    <div className="space-y-3">
                      <PaymentMethodCard
                        value="COD"
                        title="Cash on Delivery"
                        description="Pay when your order arrives"
                        selected={paymentMethod === "COD"}
                        onSelect={() => setPaymentMethod("COD")}
                        expandedNote="Have the exact amount ready when your order is delivered."
                      />
                      <PaymentMethodCard
                        value="JAZZCASH"
                        title="JazzCash"
                        description="Transfer via JazzCash, then upload your slip"
                        selected={paymentMethod === "JAZZCASH"}
                        onSelect={() => setPaymentMethod("JAZZCASH")}
                        expandedNote="After placing your order you'll see the JazzCash account details and can upload your payment slip."
                      />
                      {/* JazzCash account details */}
                      {paymentMethod === "JAZZCASH" && jazzcashSettings.jazzcash_account_name && (
                        <div className="rounded-lg border border-chrome-500 bg-surface p-4 space-y-2">
                          <p className="font-body text-xs text-muted uppercase tracking-wide">Send payment to:</p>
                          <p className="font-body text-sm text-foreground font-medium">{jazzcashSettings.jazzcash_account_name}</p>
                          <p className="font-body text-sm text-foreground font-mono">{jazzcashSettings.jazzcash_account_number}</p>
                          {jazzcashSettings.jazzcash_instructions && (
                            <p className="font-body text-xs text-muted mt-2">{jazzcashSettings.jazzcash_instructions}</p>
                          )}
                        </div>
                      )}
                      {errors.paymentMethod && (
                        <p className="checkout-field-error" role="alert">
                          {errors.paymentMethod}
                        </p>
                      )}
                    </div>
                  </FormStep>
                )}

                {/* ── STEP 6 · REVIEW ── */}
                {stepIndex === 5 && (
                  <FormStep stepNumber={6} title="Review" subtitle="Confirm your details before placing the order.">
                    <div className="space-y-0">
                      <ReviewLine label="Contact" onEdit={() => goToStep(0)}>
                        <p className="font-body text-sm text-foreground">{form.email}</p>
                      </ReviewLine>
                      <div className="checkout-review-divider" />
                      <ReviewLine label="Shipping address" onEdit={() => goToStep(1)}>
                        <p className="font-body text-sm text-foreground leading-relaxed">
                          {deliveryLabel || "—"}
                        </p>
                      </ReviewLine>
                      <div className="checkout-review-divider" />
                      <ReviewLine label="Promo code" onEdit={() => goToStep(2)}>
                        {promoCode ? (
                          <p className="font-body text-sm text-chrome-200">
                            {promoCode}
                            {discountPercent
                              ? ` — ${discountPercent}% off`
                              : discountAmount
                                ? ` — Rs. ${discountAmount.toLocaleString("en-PK")} off`
                                : ""}
                          </p>
                        ) : (
                          <p className="font-body text-sm text-muted">None</p>
                        )}
                      </ReviewLine>
                      <div className="checkout-review-divider" />
                      <ReviewLine label="Shipping method" onEdit={() => goToStep(3)}>
                        <p className="font-body text-sm text-foreground">
                          Standard shipping — {formatPrice(deliveryCharges)}
                          {selectedZone ? ` (${selectedZone.name})` : ""}
                        </p>
                      </ReviewLine>
                      <div className="checkout-review-divider" />
                      <ReviewLine label="Payment" onEdit={() => goToStep(4)}>
                        <p className="font-body text-sm text-foreground">
                          {paymentMethod === "JAZZCASH"
                            ? "JazzCash"
                            : "Cash on Delivery"}
                        </p>
                      </ReviewLine>
                      <div className="checkout-review-divider" />

                      {/* Totals */}
                      <div className="space-y-2 py-4">
                        <div className="flex justify-between">
                          <span className="font-body text-sm text-muted">Subtotal</span>
                          <span className="font-body text-sm text-foreground">
                            {formatPrice(totals.subtotal)}
                          </span>
                        </div>
                        {totals.discount > 0 && (
                          <div className="flex justify-between">
                            <span className="font-body text-sm text-muted">Discount</span>
                            <span className="font-body text-sm text-chrome-200">
                              −{formatPrice(totals.discount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="font-body text-sm text-muted">Shipping</span>
                          <span className="font-body text-sm text-foreground">
                            {formatPrice(totals.shipping)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-chrome-500 pt-3">
                          <span className="font-body text-sm font-medium text-foreground">Total</span>
                          <span className="font-display text-2xl tracking-wide text-foreground">
                            {formatPrice(totals.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </FormStep>
                )}

                {/* Server error */}
                {serverError && (
                  <div className="checkout-error border border-red-500/50 bg-red-500/10 p-4 mt-6" role="alert">
                    {serverError}
                  </div>
                )}

                {/* Loading */}
                {status === "loading" && (
                  <div className="checkout-loading mt-6">
                    <div className="checkout-loading-spinner" aria-hidden="true" />
                    <span className="checkout-loading-text">{loadingStep}</span>
                  </div>
                )}

                {/* Prev / Next / Submit */}
                <div className="checkout-step-nav">
                  {stepIndex > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="default"
                      onClick={() => goToStep(stepIndex - 1)}
                      disabled={status === "loading"}
                    >
                      ← Back
                    </Button>
                  ) : (
                    <span />
                  )}

                  {stepIndex < STEPS.length - 1 ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="default"
                      onClick={handleNext}
                      disabled={status === "loading"}
                    >
                      Continue →
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="primary"
                      size="default"
                      disabled={status === "loading"}
                    >
                      {status === "loading" ? "Processing..." : `Complete order · ${formatPrice(totals.total)}`}
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Right column — order summary (below form on mobile) */}
            <div className="w-full lg:w-[380px] flex-shrink-0">
              <OrderSummaryPanel shipping={deliveryCharges} deliveryZone={selectedZone} />
            </div>
          </div>
        )}
      </div>

      <LoginModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Sign in to complete your checkout securely."
      />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ReviewLine({
  label,
  children,
  onEdit,
}: {
  label: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="checkout-review-line">
      <div className="flex-1 min-w-0">
        <p className="font-body text-[10px] uppercase tracking-[0.15em] text-muted mb-1">
          {label}
        </p>
        {children}
      </div>
      <button type="button" onClick={onEdit} className="checkout-summary-edit">
        Edit
      </button>
    </div>
  );
}

function ShippingMethodCard({
  title,
  time,
  price,
  selected,
  onSelect,
}: {
  title: string;
  time: string;
  price: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`checkout-method-card ${
        selected ? "checkout-method-card--selected" : "checkout-method-card--unselected"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-chrome-100" : "border-chrome-400"
        }`}
        aria-hidden="true"
      >
        {selected && <span className="h-2 w-2 rounded-full bg-chrome-100" />}
      </span>
      <span className="flex-1 text-left">
        <span className="block font-body text-sm text-foreground">{title}</span>
        <span className="block font-body text-xs text-muted">{time}</span>
      </span>
      <span className="font-body text-sm text-foreground font-medium">
        {formatPrice(price)}
      </span>
    </button>
  );
}

function PaymentMethodCard({
  value,
  title,
  description,
  selected,
  onSelect,
  expandedNote,
}: {
  value: PaymentMethod;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  expandedNote: string;
}) {
  return (
    <div>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className={`checkout-method-card ${
          selected ? "checkout-method-card--selected" : "checkout-method-card--unselected"
        }`}
      >
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
            selected ? "border-chrome-100" : "border-chrome-400"
          }`}
          aria-hidden="true"
        >
          {selected && <span className="h-2 w-2 rounded-full bg-chrome-100" />}
        </span>
        <span className="flex-1 text-left">
          <span className="block font-body text-sm text-foreground">{title}</span>
          <span className="block font-body text-xs text-muted">{description}</span>
        </span>
        {selected ? (
          <Badge variant="outline">Selected</Badge>
        ) : (
          <svg
            className="checkout-chevron"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {/* Expandable note */}
      <div
        className={`checkout-method-details ${selected ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className="border border-t-0 border-chrome-500 bg-surface px-4 py-3 font-body text-xs text-muted">
          {expandedNote}
        </p>
      </div>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { deliveryDaysLabel, type DeliveryZone } from "@/types/delivery";

// The map only needs the browser, so keep it client-side rendered.
const DeliveryMap = dynamic(() => import("./DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center border border-chrome-500 bg-surface">
      <span className="font-body text-xs text-muted">Loading map…</span>
    </div>
  ),
});

// ---------------------------------------------------------------------------
// CitySelector — dropdown of delivery zones + interactive map of Pakistan
// ---------------------------------------------------------------------------

interface CitySelectorProps {
  zones: DeliveryZone[];
  selectedZoneId: string | null;
  onSelect: (zone: DeliveryZone | null) => void;
  loading?: boolean;
}

export default function CitySelector({
  zones,
  selectedZoneId,
  onSelect,
  loading = false,
}: CitySelectorProps) {
  const selectedZone = zones.find((z) => z.id === selectedZoneId) || null;

  return (
    <div className="space-y-4">
      {/* Dropdown — matches the floating-label field pattern used on this form */}
      <div>
        <div className="checkout-float-wrap">
          <select
            id="delivery-zone"
            className="checkout-float-select pr-10"
            value={selectedZoneId || ""}
            disabled={loading || zones.length === 0}
            onChange={(e) => {
              const id = e.target.value;
              onSelect(zones.find((z) => z.id === id) || null);
            }}
          >
            <option value="">{loading ? "Loading cities…" : "Select your city"}</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name} — Rs. {zone.deliveryCharges.toLocaleString("en-PK")}
              </option>
            ))}
          </select>

          {/* Chevron */}
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-chrome-300"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <label htmlFor="delivery-zone" className="checkout-float-label checkout-float-label--up">
            City / Delivery Zone
          </label>
        </div>
        {zones.length === 0 && !loading && (
          <p className="mt-1.5 font-body text-xs text-muted">
            Delivery zones are not available right now.
          </p>
        )}
      </div>

      {/* Selected zone summary */}
      {selectedZone && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border border-chrome-500 bg-surface px-4 py-3">
          <p className="font-body text-sm text-foreground">
            <span className="text-muted">Delivery to {selectedZone.name}:</span>{" "}
            <span className="font-medium">Rs. {selectedZone.deliveryCharges.toLocaleString("en-PK")}</span>
          </p>
          <p className="font-body text-sm text-muted">
            Estimated delivery {deliveryDaysLabel(selectedZone.estimatedDays)}
          </p>
        </div>
      )}

      {/* Google map — tracks the selected city + typed area */}
      <DeliveryMap
        zones={zones}
        selectedZoneId={selectedZoneId}
        onSelect={onSelect}
      />
    </div>
  );
}
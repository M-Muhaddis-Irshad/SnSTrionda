"use client";

// =============================================================================
// Google Maps delivery map with reverse geocoding.
// Uses the keyless Google Maps embed iframe (output=embed), which needs no API
// key. The "Use my location" button and area search both trigger reverse
// geocoding via the free Nominatim API so the checkout address fields are
// auto-filled.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import type { DeliveryZone } from "@/types/delivery";

function buildEmbedSrc(query: string, zoom: number): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(
    query
  )}&z=${zoom}&t=m&output=embed&iwloc=0`;
}

// ---------------------------------------------------------------------------
// Geocoded address returned by Nominatim
// ---------------------------------------------------------------------------
interface GeoAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

// ---------------------------------------------------------------------------
// Nominatim reverse geocoding (free, no API key)
// ---------------------------------------------------------------------------
async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeoAddress | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    return {
      street:
        [a.house_number, a.road, a.neighbourhood || a.suburb || a.village]
          .filter(Boolean)
          .join(" ") ||
        data.display_name?.split(",")[0] ||
        "",
      city: a.city || a.town || a.village || a.county || "",
      province: a.state || a.region || "",
      postalCode: a.postcode || "",
      country: a.country || "Pakistan",
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Nominatim forward geocoding — find coordinates for an area search query
// ---------------------------------------------------------------------------
async function forwardGeocode(
  query: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        query
      )}&limit=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

interface DeliveryMapProps {
  zones: DeliveryZone[];
  selectedZoneId: string | null;
  onSelect: (zone: DeliveryZone) => void;
  /** Called when a location is resolved — fills the address form. */
  onAddressResolved?: (address: GeoAddress) => void;
}

// ---------------------------------------------------------------------------
// DeliveryMap component
// ---------------------------------------------------------------------------
export default function DeliveryMap({
  zones,
  selectedZoneId,
  onSelect,
  onAddressResolved,
}: DeliveryMapProps) {
  const selected = zones.find((z) => z.id === selectedZoneId) || null;

  // Area / landmark typed by the customer — debounced before it pans the map.
  const [typed, setTyped] = useState("");
  const [debouncedTyped, setDebouncedTyped] = useState("");

  // Browser geolocation (only when the customer allows it).
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  // Geocoding status
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTyped(typed.trim()), 350);
    return () => clearTimeout(t);
  }, [typed]);

  // When the selected city changes, drop the typed area + geolocation so the
  // map doesn't silently show a stale neighbourhood from a previous city.
  useEffect(() => {
    setTyped("");
    setDebouncedTyped("");
    setCoords(null);
    setGeoError("");
    setGeocodeError("");
  }, [selectedZoneId]);

  // ── Current location ─────────────────────────────────────────────────────
  function locateMe() {
    setGeoError("");
    setGeocodeError("");
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocating(false);
        setTyped(""); // typed area, if any, no longer drives the map
        setCoords({ lat, lng });

        // Reverse geocode to fill address fields
        setGeocoding(true);
        try {
          const addr = await reverseGeocode(lat, lng);
          if (addr && onAddressResolved) {
            onAddressResolved(addr);
          }
        } catch {
          setGeocodeError("Could not resolve address for your location.");
        } finally {
          setGeocoding(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            "Location permission was denied. You can still type your area above."
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError("Your location could not be determined right now.");
        } else {
          setGeoError(
            "Timed out while getting your location. Please try again."
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  // ── Area search — geocode the typed query and reverse-geocode for address ─
  useEffect(() => {
    if (!debouncedTyped || !selected) return;
    let cancelled = false;

    async function geocodeArea() {
      const query = `${debouncedTyped}, ${selected!.name}, Pakistan`;
      setGeocoding(true);
      setGeocodeError("");
      try {
        const coords = await forwardGeocode(query);
        if (cancelled || !coords) return;
        // Reverse geocode the found coordinates to get a full address
        const addr = await reverseGeocode(coords.lat, coords.lng);
        if (!cancelled && addr && onAddressResolved) {
          onAddressResolved(addr);
        }
      } catch {
        if (!cancelled) setGeocodeError("Could not resolve address for this area.");
      } finally {
        if (!cancelled) setGeocoding(false);
      }
    }

    geocodeArea();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTyped, selected]);

  // ── Effective map query ──────────────────────────────────────────────────
  const query = useMemo(() => {
    const cityPart = selected ? `${selected.name}, Pakistan` : "Pakistan";
    // 1) typed area wins
    if (debouncedTyped) return `${debouncedTyped}, ${cityPart}`;
    // 2) then the user's live location (shown as lat,lng pin)
    if (coords) return `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
    // 3) then the selected city
    if (selected) return cityPart;
    return "";
  }, [debouncedTyped, selected, coords]);

  const zoom = debouncedTyped ? 12 : coords ? 14 : selected ? 11 : 5;
  const src = query ? buildEmbedSrc(query, zoom) : "";

  const showingMyLocation = !!coords && !debouncedTyped;

  return (
    <div className="space-y-3">
      {/* Area search + current-location row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="checkout-float-wrap flex-1">
          <input
            id="map-area-search"
            type="text"
            className="checkout-float-input"
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              if (coords) setCoords(null);
              if (geoError) setGeoError("");
            }}
            autoComplete="off"
          />
          <label
            htmlFor="map-area-search"
            className={`checkout-float-label ${typed ? "checkout-float-label--up" : ""}`}
          >
            Area / landmark (optional)
          </label>
        </div>
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="flex shrink-0 items-center justify-center gap-2 border border-chrome-500 px-4 py-3 font-body text-xs tracking-wider text-muted transition-colors hover:border-chrome-300 hover:text-foreground disabled:opacity-60"
        >
          {locating ? (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10Zm0-7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              />
            </svg>
          )}
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>

      {geoError && (
        <p className="font-body text-xs text-red-400" role="alert">
          {geoError}
        </p>
      )}
      {geocoding && (
        <p className="font-body text-[11px] text-chrome-200">
          Resolving address…
        </p>
      )}
      {geocodeError && (
        <p className="font-body text-xs text-amber-400" role="alert">
          {geocodeError}
        </p>
      )}
      {showingMyLocation && !geocoding && (
        <p className="font-body text-[11px] text-chrome-200">
          Showing your current location ({coords!.lat.toFixed(5)},{" "}
          {coords!.lng.toFixed(5)}) — address fields updated above.
        </p>
      )}

      {/* Google Maps embed */}
      <div className="relative overflow-hidden border border-chrome-500 bg-surface">
        {src ? (
          <iframe
            src={src}
            title={query ? `Map of ${query}` : "Delivery map"}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[320px] w-full border-0"
          />
        ) : (
          <div className="flex h-[320px] items-center justify-center">
            <span className="font-body text-xs text-muted">
              Pick a city above to see it on the map.
            </span>
          </div>
        )}
      </div>

      {/* Quick city chips — keeps one-tap selection near the map */}
      {zones.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {zones.map((zone) => {
            const active = zone.id === selectedZoneId;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => onSelect(zone)}
                className={`border px-3 py-1 font-body text-xs transition-colors ${
                  active
                    ? "border-chrome-200 bg-chrome-500 text-foreground"
                    : "border-chrome-500 text-muted hover:border-chrome-300 hover:text-foreground"
                }`}
              >
                {zone.name}
              </button>
            );
          })}
        </div>
      )}

      <p className="font-body text-[11px] text-muted">
        The map updates as you pick a city, type your area, or share your
        location — your address fields are auto-filled from the resolved
        location.
      </p>
    </div>
  );
}

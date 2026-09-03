"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DeliveryZone } from "@/types/delivery";

// ---------------------------------------------------------------------------
// Custom pin icon (avoids Leaflet's broken default marker assets under bundlers)
// ---------------------------------------------------------------------------

function pinIcon(selected: boolean) {
  return L.divIcon({
    className: "",
    html: `
      <svg width="30" height="38" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,.4));">
        <path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 23 15 23s15-11.75 15-23C30 6.716 23.284 0 15 0z" fill="${selected ? "#1a1a1a" : "#ffffff"}"/>
        <circle cx="15" cy="15" r="6" fill="${selected ? "#ffffff" : "#1a1a1a"}"/>
      </svg>
    `,
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    popupAnchor: [0, -34],
  });
}

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------

interface DeliveryMapProps {
  zones: DeliveryZone[];
  selectedZoneId: string | null;
  onSelect: (zone: DeliveryZone) => void;
}

export default function DeliveryMap({ zones, selectedZoneId, onSelect }: DeliveryMapProps) {
  // Ensure the map re-renders at correct size once mounted (common Leaflet-in-React gotcha)
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <MapContainer
      center={[30.3753, 69.3451]}
      zoom={5}
      scrollWheelZoom={false}
      style={{ height: "320px", width: "100%", zIndex: 0 }}
      className="border border-chrome-500"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {zones.map((zone) => (
        <Marker
          key={zone.id}
          position={[zone.latitude, zone.longitude]}
          icon={pinIcon(zone.id === selectedZoneId)}
          eventHandlers={{ click: () => onSelect(zone) }}
        >
          <Popup>
            <strong>{zone.name}</strong>
            <br />
            Rs. {zone.deliveryCharges.toLocaleString("en-PK")} ·{" "}
            {zone.estimatedDays <= 1
              ? "1 day"
              : `${zone.estimatedDays - 1}–${zone.estimatedDays} days`}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
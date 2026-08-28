"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MeasurementFormProps {
  apiUrl: string;
}

type MeasurementFields = {
  chest: string;
  waist: string;
  shoulder: string;
  sleeveLength: string;
  neck: string;
  hip: string;
  inseam: string;
  thigh: string;
  rise: string;
  cuff: string;
  height: string;
  notes: string;
};

const INITIAL_FIELDS: MeasurementFields = {
  chest: "", waist: "", shoulder: "", sleeveLength: "", neck: "",
  hip: "", inseam: "", thigh: "", rise: "", cuff: "",
  height: "", notes: "",
};

const MEASUREMENT_KEYS = [
  "chest", "waist", "shoulder", "sleeveLength", "neck",
  "hip", "inseam", "thigh", "rise", "cuff", "height",
] as const;

// ---------------------------------------------------------------------------
// Field labels
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  chest: "Chest",
  waist: "Waist",
  shoulder: "Shoulder",
  sleeveLength: "Sleeve Length",
  neck: "Neck",
  hip: "Hip",
  inseam: "Inseam",
  thigh: "Thigh",
  rise: "Rise",
  cuff: "Cuff",
  height: "Height",
};

// ---------------------------------------------------------------------------
// MeasurementForm Component
// ---------------------------------------------------------------------------

export default function MeasurementForm({ apiUrl }: MeasurementFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fields, setFields] = useState<MeasurementFields>(INITIAL_FIELDS);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  // TODO: pass measurementId to cart state once cart exists
  const [measurementId, setMeasurementId] = useState<string | null>(null);

  function handleChange(key: keyof MeasurementFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    // Reset status on new input
    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  }

  function validate(): string | null {
    const hasAtLeastOne = MEASUREMENT_KEYS.some((key) => {
      const val = fields[key];
      return val !== "" && val !== "0";
    });

    if (!hasAtLeastOne) {
      return "Please fill in at least one measurement field.";
    }

    // Range check
    for (const key of MEASUREMENT_KEYS) {
      const val = fields[key];
      if (val !== "") {
        const num = parseFloat(val);
        if (isNaN(num)) return `${FIELD_LABELS[key]} must be a valid number.`;
        if (num < 0) return `${FIELD_LABELS[key]} cannot be negative.`;
        if (num > 100) return `${FIELD_LABELS[key]} seems unreasonably large (max 100 inches).`;
      }
    }

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
      // Build payload — only include non-empty fields
      const payload: Record<string, any> = {};
      for (const key of MEASUREMENT_KEYS) {
        const val = fields[key];
        if (val !== "") {
          payload[key] = parseFloat(val);
        }
      }
      if (fields.notes.trim()) {
        payload.notes = fields.notes.trim();
      }

      const res = await fetch(`${apiUrl}/api/measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Failed to save measurements.");
        return;
      }

      setMeasurementId(data.data.id);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Could not connect to the server. Please try again.");
    }
  }

  // --- Render ---

  if (status === "success") {
    return (
      <div className="mt-6 border border-chrome-500 p-6">
        <p className="font-body text-sm text-foreground">
          ✓ Measurements saved — we&apos;ll use these when you check out.
        </p>
        <p className="mt-1 font-body text-xs text-muted">
          Measurement ID: {measurementId}
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setFields(INITIAL_FIELDS);
            setIsOpen(false);
          }}
          className="mt-3 font-body text-xs tracking-wider text-muted underline transition-colors hover:text-foreground"
        >
          Submit new measurements
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Toggle button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="font-body text-sm tracking-wider text-muted underline transition-colors hover:text-foreground"
        >
          Add Your Measurements
        </button>
      )}

      {/* Collapsible form */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="border border-chrome-500 p-6 space-y-8">
          {/* Close / collapse button */}
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wider text-foreground">
              Your Measurements
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-body text-xs tracking-wider text-muted transition-colors hover:text-foreground"
            >
              Collapse
            </button>
          </div>

          <p className="font-body text-xs text-muted">
            All measurements in inches. Fill in what you can — we&apos;ll confirm the rest during your consultation.
          </p>

          {/* Upper Body */}
          <fieldset>
            <legend className="font-body text-sm tracking-wider uppercase text-muted mb-4">
              Upper Body
            </legend>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {(["chest", "waist", "shoulder", "sleeveLength", "neck"] as const).map((key) => (
                <div key={key}>
                  <label className="block font-body text-xs text-muted mb-1">
                    {FIELD_LABELS[key]}
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="100"
                    value={fields[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full border border-chrome-500 bg-transparent px-3 py-2 font-body text-sm text-foreground placeholder-chrome-400 focus:border-chrome-300 focus:outline-none transition-colors"
                    placeholder={`e.g. ${key === "chest" ? "40" : key === "waist" ? "34" : ""}`}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {/* Lower Body */}
          <fieldset>
            <legend className="font-body text-sm tracking-wider uppercase text-muted mb-4">
              Lower Body
            </legend>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {(["hip", "inseam", "thigh", "rise", "cuff"] as const).map((key) => (
                <div key={key}>
                  <label className="block font-body text-xs text-muted mb-1">
                    {FIELD_LABELS[key]}
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="100"
                    value={fields[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full border border-chrome-500 bg-transparent px-3 py-2 font-body text-sm text-foreground placeholder-chrome-400 focus:border-chrome-300 focus:outline-none transition-colors"
                    placeholder={`e.g. ${key === "inseam" ? "32" : key === "hip" ? "42" : ""}`}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {/* General */}
          <fieldset>
            <legend className="font-body text-sm tracking-wider uppercase text-muted mb-4">
              General
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-xs text-muted mb-1">
                  Height
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="100"
                  value={fields.height}
                  onChange={(e) => handleChange("height", e.target.value)}
                  className="w-full border border-chrome-500 bg-transparent px-3 py-2 font-body text-sm text-foreground placeholder-chrome-400 focus:border-chrome-300 focus:outline-none transition-colors"
                  placeholder="e.g. 70"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-body text-xs text-muted mb-1">
                  Notes / Special Instructions
                </label>
                <textarea
                  value={fields.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  className="w-full border border-chrome-500 bg-transparent px-3 py-2 font-body text-sm text-foreground placeholder-chrome-400 focus:border-chrome-300 focus:outline-none transition-colors resize-none"
                  placeholder="Fit preferences, body shape notes, etc."
                />
              </div>
            </div>
          </fieldset>

          {/* Error message */}
          {status === "error" && (
            <p className="font-body text-sm text-red-400">{errorMessage}</p>
          )}

          {/* Submit */}
          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Saving..." : "Save Measurements"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

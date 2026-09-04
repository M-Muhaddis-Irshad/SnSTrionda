"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Truck, Pencil, Trash2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import Modal, {
  inputCls,
  btnPrimaryCls,
  btnSecondaryCls,
  btnDangerCls,
  fieldErrorCls,
} from "@/app/admin/media/components/Modal";
import type { DeliveryZone } from "@/types/delivery";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ---------------------------------------------------------------------------
// API helpers (admin)
// ---------------------------------------------------------------------------

async function adminRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/admin${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface ZoneForm {
  name: string;
  latitude: string;
  longitude: string;
  deliveryCharges: string;
  estimatedDays: string;
  active: boolean;
}

const EMPTY_FORM: ZoneForm = {
  name: "",
  latitude: "",
  longitude: "",
  deliveryCharges: "",
  estimatedDays: "2",
  active: true,
};

function zoneToForm(zone: DeliveryZone): ZoneForm {
  return {
    name: zone.name,
    latitude: String(zone.latitude),
    longitude: String(zone.longitude),
    deliveryCharges: String(zone.deliveryCharges),
    estimatedDays: String(zone.estimatedDays),
    active: zone.active,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DeliveryPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<DeliveryZone | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryZone | null>(null);
  const [form, setForm] = useState<ZoneForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadZones = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await adminRequest<{ data: DeliveryZone[] }>("/delivery-zones");
      setZones(result.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load delivery zones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  function validateForm(): string {
    if (!form.name.trim()) return "City name is required.";
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    const charges = Number(form.deliveryCharges);
    const days = Number(form.estimatedDays);
    if (form.latitude === "" || isNaN(lat) || lat < -90 || lat > 90) {
      return "Latitude must be between -90 and 90.";
    }
    if (form.longitude === "" || isNaN(lng) || lng < -180 || lng > 180) {
      return "Longitude must be between -180 and 180.";
    }
    if (form.deliveryCharges === "" || isNaN(charges) || charges <= 0) {
      return "Delivery charges must be greater than 0.";
    }
    if (isNaN(days) || !Number.isInteger(days) || days < 1 || days > 7) {
      return "Estimated days must be a whole number between 1 and 7.";
    }
    return "";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        deliveryCharges: Number(form.deliveryCharges),
        estimatedDays: Number(form.estimatedDays),
        active: form.active,
      };
      if (modal === "create") {
        await adminRequest("/delivery-zones", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else if (modal === "edit" && editing) {
        await adminRequest(`/delivery-zones/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      setModal(null);
      setEditing(null);
      setForm(EMPTY_FORM);
      await loadZones();
    } catch (err: any) {
      setFormError(err.message || "Failed to save delivery zone");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminRequest(`/delivery-zones/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await loadZones();
    } catch (err: any) {
      alert(err.message || "Failed to delete delivery zone");
    } finally {
      setDeleting(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditing(null);
    setModal("create");
  }

  function openEdit(zone: DeliveryZone) {
    setForm(zoneToForm(zone));
    setFormError("");
    setEditing(zone);
    setModal("edit");
  }

  async function toggleActive(zone: DeliveryZone) {
    try {
      await adminRequest(`/delivery-zones/${zone.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !zone.active }),
      });
      await loadZones();
    } catch (err: any) {
      alert(err.message || "Failed to update zone");
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Delivery Zones &amp; Charges</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage Pakistan cities, delivery charges and estimated delivery times.
          </p>
        </div>
        <button onClick={openCreate} className={btnPrimaryCls + " flex items-center gap-2"}>
          <Plus size={16} />
          Add New Zone
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-gray-400 text-center py-16">Loading delivery zones…</div>
        ) : zones.length === 0 ? (
          <div className="text-gray-400 text-center py-16">
            <Truck size={32} className="mx-auto mb-3 text-gray-600" />
            <p>No delivery zones yet. Add your first city.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="px-4 py-3 font-semibold">City</th>
                  <th className="px-4 py-3 font-semibold">Latitude</th>
                  <th className="px-4 py-3 font-semibold">Longitude</th>
                  <th className="px-4 py-3 font-semibold">Charges (Rs)</th>
                  <th className="px-4 py-3 font-semibold">Est. Days</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr
                    key={zone.id}
                    className={`border-b border-gray-800/60 hover:bg-gray-800/40 transition ${
                      zone.active ? "" : "opacity-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-white font-semibold">{zone.name}</td>
                    <td className="px-4 py-3 text-gray-400">{zone.latitude.toFixed(4)}</td>
                    <td className="px-4 py-3 text-gray-400">{zone.longitude.toFixed(4)}</td>
                    <td className="px-4 py-3 text-white font-medium">
                      {zone.deliveryCharges.toLocaleString("en-PK")}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {zone.estimatedDays <= 1
                        ? "1 day"
                        : `${zone.estimatedDays - 1}–${zone.estimatedDays} days`}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(zone)}
                        className={`text-xs px-2 py-1 rounded border transition ${
                          zone.active
                            ? "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
                            : "bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700"
                        }`}
                      >
                        {zone.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(zone)}
                          aria-label={`Edit ${zone.name}`}
                          title="Edit"
                          className="p-2 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(zone)}
                          aria-label={`Delete ${zone.name}`}
                          title="Delete"
                          className="p-2 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit modal ── */}
      {modal && (
        <Modal
          title={modal === "create" ? "Add Delivery Zone" : `Edit ${editing?.name || "Zone"}`}
          onClose={() => {
            if (!saving) {
              setModal(null);
              setEditing(null);
            }
          }}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
                City Name
              </label>
              <input
                type="text"
                className={inputCls}
                value={form.name}
                disabled={modal === "edit"}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Karachi"
              />
              {modal === "edit" && (
                <p className="text-xs text-gray-500 mt-1">City name cannot be changed.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  className={inputCls}
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="24.8607"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  className={inputCls}
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="67.0011"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
                  Delivery Charges (Rs)
                </label>
                <input
                  type="number"
                  min="1"
                  className={inputCls}
                  value={form.deliveryCharges}
                  onChange={(e) => setForm({ ...form, deliveryCharges: e.target.value })}
                  placeholder="300"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
                  Estimated Days
                </label>
                <select
                  className={inputCls}
                  value={form.estimatedDays}
                  onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <option key={d} value={d}>
                      {d <= 1 ? "1 day" : `${d - 1}–${d} days`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="accent-white"
              />
              Active (shown in checkout)
            </label>

            {formError && <p className={fieldErrorCls}>{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className={btnSecondaryCls}
                onClick={() => {
                  setModal(null);
                  setEditing(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimaryCls}>
                {saving ? "Saving…" : modal === "create" ? "Create Zone" : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <Modal
          title="Delete Delivery Zone"
          onClose={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <p className="text-sm text-gray-300 mb-1">
            This zone will be deleted:{" "}
            <span className="text-white font-semibold">{deleteTarget.name}</span>.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            Orders already placed are not affected. Inactive zones are hidden from
            the checkout dropdown.
          </p>
          <div className="flex justify-end gap-2">
            <button className={btnSecondaryCls} onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button className={btnDangerCls} onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Zone"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
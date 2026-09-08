"use client";

// =============================================================================
// Admin Store Settings — edit storefront-facing configuration:
//   GET /api/admin/settings    → { data: { key: value } }
//   PUT /api/admin/settings    → { ...partial map } (known keys only)
// Settings are consumed by the storefront (footer contact/socials etc.).
// =============================================================================

import { useEffect, useState } from "react";
import { Settings, Loader2 } from "lucide-react";
import {
  inputCls,
  btnPrimaryCls,
} from "@/app/admin/media/components/Modal";
import { fetchAdminSettings, updateAdminSettings } from "@/lib/admin-api";

// ---------------------------------------------------------------------------
// Field definitions — mirror the backend SETTING_KEYS
// ---------------------------------------------------------------------------

interface SettingField {
  key: string;
  label: string;
  placeholder?: string;
  help?: string;
  type?: "text" | "checkbox" | "textarea";
  section: string;
}

const FIELDS: SettingField[] = [
  { key: "store_name", label: "Store Name", section: "Store" },
  { key: "store_tagline", label: "Tagline", section: "Store" },
  { key: "contact_email", label: "Contact Email", type: "text", section: "Contact" },
  { key: "contact_phone", label: "Contact Phone", type: "text", section: "Contact" },
  { key: "contact_whatsapp", label: "WhatsApp Number", type: "text", section: "Contact", help: "Digits only, e.g. 923001234567" },
  { key: "address", label: "Address", type: "textarea", section: "Contact" },
  { key: "instagram", label: "Instagram URL", type: "text", section: "Social" },
  { key: "facebook", label: "Facebook URL", type: "text", section: "Social" },
  { key: "tiktok", label: "TikTok URL", type: "text", section: "Social" },
  { key: "announcement_enabled", label: "Show announcement bar", type: "checkbox", section: "Announcement" },
  { key: "announcement_text", label: "Announcement Text", type: "textarea", section: "Announcement", help: "e.g. Free delivery on orders over Rs. 5,000" },
  { key: "shipping_note", label: "Shipping Note", type: "textarea", section: "Store", help: "Shown near delivery information" },
  { key: "jazzcash_account_name", label: "Account Name", section: "JazzCash Payments", help: "Name on the JazzCash account (e.g. Trionda Wears)" },
  { key: "jazzcash_account_number", label: "Account Number", section: "JazzCash Payments", help: "JazzCash mobile number (e.g. 03001234567)" },
  { key: "jazzcash_instructions", label: "Instructions for Customers", type: "textarea", section: "JazzCash Payments", help: "Shown to customer when they select JazzCash at checkout" },
];

const SECTIONS = ["Store", "Contact", "Social", "Announcement", "JazzCash Payments"];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchAdminSettings()
      .then((res) => {
        if (cancelled) return;
        setValues(res.data || {});
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.message || "Failed to load settings");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await updateAdminSettings(values);
      setValues(res.data || values);
      setNotice("Settings saved — the storefront will update automatically.");
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-gray-400 text-center py-16 flex flex-col items-center gap-2">
        <Loader2 size={20} className="animate-spin text-gray-600" />
        Loading settings…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Store Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Contact details, social links and announcements shown across the
            storefront.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className={btnPrimaryCls + " flex items-center gap-2 disabled:opacity-60"}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      {notice && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">
          {notice}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {SECTIONS.map((section) => {
        const fields = FIELDS.filter((f) => f.section === section);
        return (
          <section
            key={section}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6"
          >
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings size={14} className="text-gray-500" />
              {section}
            </h2>
            <div className="space-y-4">
              {fields.map((field) => {
                if (field.type === "checkbox") {
                  const checked = values[field.key] === "true";
                  return (
                    <label
                      key={field.key}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setValue(field.key, e.target.checked ? "true" : "false")
                        }
                        className="accent-white"
                      />
                      {field.label}
                    </label>
                  );
                }
                const common = {
                  className: inputCls,
                  value: values[field.key] ?? "",
                  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    setValue(field.key, e.target.value),
                };
                return (
                  <div key={field.key}>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
                      {field.label}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        {...common}
                        className={inputCls + " min-h-[70px] resize-y"}
                        placeholder={field.placeholder || ""}
                      />
                    ) : (
                      <input
                        {...common}
                        type="text"
                        placeholder={field.placeholder || ""}
                      />
                    )}
                    {field.help && (
                      <p className="text-xs text-gray-500 mt-1">{field.help}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className={btnPrimaryCls + " flex items-center gap-2 disabled:opacity-60"}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </form>
  );
}

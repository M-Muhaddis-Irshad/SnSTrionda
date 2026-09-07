"use client";

// =============================================================================
// Admin Profile — customize the admin's own account (avatar, name, phone).
// Reuses the same user-scoped endpoints as the customer profile:
//   GET   /api/auth/me          (via the auth store / refresh)
//   PATCH /api/auth/me          (name, phone)
//   POST  /api/auth/me/avatar   (multipart image upload)
// =============================================================================

import { useRef, useState } from "react";
import { Camera, Loader2, Save } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function getInitials(name?: string | null): string {
  if (!name) return "A";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminProfilePage() {
  const { user, accessToken, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      updateUser(data.user);
      setMsg({ ok: true, text: "Profile updated" });
    } catch (err: any) {
      setMsg({ ok: false, text: err.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setUploading(true);
    setMsg(null);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_URL}/api/auth/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Avatar upload failed");
      updateUser(data.user);
      setMsg({ ok: true, text: "Photo updated" });
    } catch (err: any) {
      setMsg({ ok: false, text: err.message || "Avatar upload failed" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your account details — name and photo appear in the admin sidebar.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
          {/* Avatar */}
          <div className="flex flex-col items-center sm:items-start gap-3 shrink-0">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center bg-gray-800 border border-gray-700">
                {uploading ? (
                  <Loader2 size={28} className="text-gray-500 animate-spin" />
                ) : user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name || "Profile photo"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-gray-400 font-semibold">
                    {getInitials(user?.name)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Upload profile photo"
                title="Change photo"
                className="absolute -top-1 -right-1 h-8 w-8 rounded-full border border-gray-600 bg-gray-800 text-gray-200 flex items-center justify-center hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatar}
              />
            </div>
            <p className="text-[11px] text-gray-500 text-center sm:text-left">
              {user?.image ? "Tap the camera to change" : "Upload a profile photo"}
            </p>
          </div>

          {/* Details */}
          <form onSubmit={handleSave} className="flex-1 min-w-0 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h2 className="text-xl text-white font-semibold truncate">
                  {user?.name || "Admin"}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5 break-all">{user?.email}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 border border-gray-700 text-gray-400 rounded">
                {user?.role || "ADMIN"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-gray-500 transition"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-gray-500 transition"
                  placeholder="03XX-XXXXXXX"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Member since {formatDate(user?.createdAt)}
            </p>

            {msg && (
              <p className={`text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`}>
                {msg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-semibold rounded hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
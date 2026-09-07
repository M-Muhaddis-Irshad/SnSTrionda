"use client";

// =============================================================================
// Admin Landing Page — manage the storefront hero banner slides.
//   GET    /api/admin/landing
//   POST   /api/admin/landing           (multipart: image + fields)
//   PATCH  /api/admin/landing/:id       (multipart: image + fields)
//   DELETE /api/admin/landing/:id
// Changes broadcast a catalog:changed event so the live homepage refreshes.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Layout, Plus, Pencil, Trash2, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import Modal, {
  inputCls,
  btnPrimaryCls,
  btnSecondaryCls,
  btnDangerCls,
  fieldErrorCls,
} from "@/app/admin/media/components/Modal";
import {
  fetchAdminSlides,
  createAdminSlide,
  updateAdminSlide,
  deleteAdminSlide,
} from "@/lib/admin-api";

interface AdminSlide {
  id: string;
  heading: string;
  headingAccent: string | null;
  subheading: string | null;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
  overlayGradient: string | null;
  active: boolean;
  sortOrder: number;
}

export default function LandingPage() {
  const [slides, setSlides] = useState<AdminSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; slide: AdminSlide } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminSlide | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAdminSlides();
      setSlides((res.data || []).sort((a: AdminSlide, b: AdminSlide) => a.sortOrder - b.sortOrder));
    } catch (err: any) {
      setError(err.message || "Failed to load slides");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAdminSlide(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete slide");
    } finally {
      setDeleting(false);
    }
  }

  // Simple reorder: swap sortOrder of two adjacent slides via PATCH
  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const a = slides[index];
    const b = slides[target];
    const formA = new FormData();
    formA.append("sortOrder", String(b.sortOrder));
    const formB = new FormData();
    formB.append("sortOrder", String(a.sortOrder));
    try {
      await Promise.all([updateAdminSlide(a.id, formA), updateAdminSlide(b.id, formB)]);
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to reorder slides");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Landing Page</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hero banners shown on the storefront homepage — image, headings, CTA and order.
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className={btnPrimaryCls + " flex items-center gap-2"}
        >
          <Plus size={16} />
          Add Slide
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-gray-400 text-center py-16">
            <Loader2 size={24} className="mx-auto mb-3 animate-spin text-gray-600" />
            Loading slides…
          </div>
        ) : slides.length === 0 ? (
          <div className="text-gray-400 text-center py-16">
            <Layout size={32} className="mx-auto mb-3 text-gray-600" />
            <p>No hero slides yet. Add one to show a banner on the homepage.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="px-4 py-3 font-semibold">Preview</th>
                  <th className="px-4 py-3 font-semibold">Heading</th>
                  <th className="px-4 py-3 font-semibold">CTA</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slides.map((s, index) => (
                  <tr
                    key={s.id}
                    className={`border-b border-gray-800/60 hover:bg-gray-800/40 transition ${
                      !s.active ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      {s.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.imageUrl}
                          alt={s.heading}
                          className="h-14 w-24 object-cover rounded border border-gray-700"
                        />
                      ) : (
                        <div className="h-14 w-24 rounded border border-gray-700 bg-gray-800 flex items-center justify-center text-[10px] text-gray-500">
                          Gradient only
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">
                        {s.heading}
                        {s.headingAccent && (
                          <span className="text-gray-400"> {s.headingAccent}</span>
                        )}
                      </p>
                      {s.subheading && (
                        <p className="text-xs text-gray-500 truncate max-w-[240px]">
                          {s.subheading}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {s.ctaLabel}
                      <span className="text-xs text-gray-500 block">{s.ctaHref}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 w-5 text-center">{s.sortOrder}</span>
                        <button
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          aria-label="Move up"
                          className="p-1 rounded border border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-30 transition"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => move(index, 1)}
                          disabled={index === slides.length - 1}
                          aria-label="Move down"
                          className="p-1 rounded border border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-30 transition"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded border ${
                          s.active
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-gray-800 text-gray-500 border-gray-700"
                        }`}
                      >
                        {s.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setModal({ mode: "edit", slide: s })}
                          aria-label={`Edit slide ${s.heading}`}
                          title="Edit"
                          className="p-2 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(s);
                            setDeleteError("");
                          }}
                          aria-label={`Delete slide ${s.heading}`}
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

      {modal && (
        <SlideFormModal
          mode={modal.mode}
          editing={modal.mode === "edit" ? modal.slide : null}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}

      {deleteTarget && (
        <Modal
          title={`Delete "${deleteTarget.heading}"?`}
          onClose={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <p className="text-sm text-gray-300 mb-4">
            This hero slide will be removed from the homepage.
          </p>
          {deleteError && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
              {deleteError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button className={btnSecondaryCls} onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button className={btnDangerCls} onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Slide"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / Edit form modal
// ---------------------------------------------------------------------------

function SlideFormModal({
  mode,
  editing,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  editing: AdminSlide | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [heading, setHeading] = useState(editing?.heading || "");
  const [headingAccent, setHeadingAccent] = useState(editing?.headingAccent || "");
  const [subheading, setSubheading] = useState(editing?.subheading || "");
  const [ctaLabel, setCtaLabel] = useState(editing?.ctaLabel || "Shop Collection");
  const [ctaHref, setCtaHref] = useState(editing?.ctaHref || "/shop");
  const [imageUrl, setImageUrl] = useState(editing?.imageUrl || "");
  const [overlayGradient, setOverlayGradient] = useState(editing?.overlayGradient || "");
  const [active, setActive] = useState(editing ? editing.active : true);
  const [sortOrder, setSortOrder] = useState(String(editing?.sortOrder ?? 0));
  const [file, setFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("heading", heading.trim());
      fd.append("headingAccent", headingAccent.trim());
      fd.append("subheading", subheading.trim());
      fd.append("ctaLabel", ctaLabel.trim() || "Shop Collection");
      fd.append("ctaHref", ctaHref.trim() || "/shop");
      fd.append("imageUrl", imageUrl.trim());
      fd.append("overlayGradient", overlayGradient.trim());
      fd.append("active", String(active));
      fd.append("sortOrder", String(Number(sortOrder) || 0));
      if (file) fd.append("image", file);

      if (mode === "create") {
        await createAdminSlide(fd);
      } else if (editing) {
        await updateAdminSlide(editing.id, fd);
      }
      onClose();
      onSaved();
    } catch (err: any) {
      setFormError(err.message || "Failed to save slide");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={mode === "create" ? "Add Hero Slide" : `Edit "${editing?.heading || "Slide"}"`}
      onClose={() => {
        if (!saving) onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Heading *
            </label>
            <input
              type="text"
              className={inputCls}
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="e.g. TRIONDA"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Heading accent (2nd line)
            </label>
            <input
              type="text"
              className={inputCls}
              value={headingAccent}
              onChange={(e) => setHeadingAccent(e.target.value)}
              placeholder="e.g. WEARS"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Subheading
          </label>
          <textarea
            className={inputCls}
            rows={2}
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
            placeholder="One line describing this banner…"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              CTA Label
            </label>
            <input
              type="text"
              className={inputCls}
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Shop Collection"
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              CTA Link
            </label>
            <input
              type="text"
              className={inputCls}
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
              placeholder="/shop"
            />
          </div>
        </div>

        {/* Image */}
        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Banner Image
          </label>
          <input
            type="text"
            className={inputCls}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… (Cloudinary / media URL)"
          />
          <div className="flex items-center gap-3 mt-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs px-3 py-2 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 transition"
            >
              {file ? `Selected: ${file.name}` : "Upload image instead…"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Overlay gradient (used when no image)
          </label>
          <input
            type="text"
            className={inputCls}
            value={overlayGradient}
            onChange={(e) => setOverlayGradient(e.target.value)}
            placeholder="radial-gradient(ellipse at 50% 40%, #1a1a1a 0%, #000 100%)"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Sort order
            </label>
            <input
              type="number"
              min="0"
              className={inputCls}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="accent-white"
              />
              Active (shown on homepage)
            </label>
          </div>
        </div>

        {formError && <p className={fieldErrorCls}>{formError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className={btnSecondaryCls}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" disabled={saving} className={btnPrimaryCls}>
            {saving ? "Saving…" : mode === "create" ? "Create Slide" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
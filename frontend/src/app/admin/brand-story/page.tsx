"use client";

// =============================================================================
// Admin Brand Story — manage the “Our Story” section shown on the homepage.
//   GET    /api/admin/brand-story
//   POST   /api/admin/brand-story           (multipart: image + fields)
//   PATCH  /api/admin/brand-story/:id       (multipart: image + fields)
//   DELETE /api/admin/brand-story/:id
// Changes broadcast a catalog:changed event so the live homepage refreshes.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, BookOpen } from "lucide-react";
import Modal, {
  inputCls,
  btnPrimaryCls,
  btnSecondaryCls,
  btnDangerCls,
  fieldErrorCls,
} from "@/app/admin/media/components/Modal";
import {
  fetchAdminBrandStory,
  createAdminBrandStory,
  updateAdminBrandStory,
  deleteAdminBrandStory,
} from "@/lib/admin-api";

interface BrandStoryItem {
  id: string;
  label: string;
  heading: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
}

export default function BrandStoryPage() {
  const [stories, setStories] = useState<BrandStoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; story: BrandStoryItem } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrandStoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAdminBrandStory();
      setStories(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load brand stories");
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
      await deleteAdminBrandStory(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete story");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Brand Story</h1>
          <p className="text-sm text-gray-500 mt-1">
            The “Our Story” section on the homepage — heading, text, CTA and image.
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className={btnPrimaryCls + " flex items-center gap-2"}
        >
          <Plus size={16} />
          Add Story
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
            Loading stories…
          </div>
        ) : stories.length === 0 ? (
          <div className="text-gray-400 text-center py-16">
            <BookOpen size={32} className="mx-auto mb-3 text-gray-600" />
            <p>No brand story yet. Add one to show the “Our Story” section content.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="px-4 py-3 font-semibold">Preview</th>
                  <th className="px-4 py-3 font-semibold">Heading</th>
                  <th className="px-4 py-3 font-semibold">CTA</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stories.map((s) => (
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
                        <div className="h-14 w-24 rounded border border-dashed border-gray-600 flex items-center justify-center text-[10px] text-gray-500">
                          No image
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{s.heading}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[260px]">{s.text}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {s.ctaLabel}
                      <span className="text-xs text-gray-500 block">{s.ctaHref}</span>
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
                          onClick={() => setModal({ mode: "edit", story: s })}
                          aria-label={`Edit story ${s.heading}`}
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
                          aria-label={`Delete story ${s.heading}`}
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
        <StoryFormModal
          mode={modal.mode}
          editing={modal.mode === "edit" ? modal.story : null}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}

      {deleteTarget && (
        <Modal
          title={`Delete “${deleteTarget.heading}”?`}
          onClose={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <p className="text-sm text-gray-300 mb-4">
            The homepage will fall back to the built-in story content.
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
              {deleting ? "Deleting…" : "Delete Story"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / edit form modal
// ---------------------------------------------------------------------------

function StoryFormModal({
  mode,
  editing,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  editing: BrandStoryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(editing?.label || "Our Story");
  const [heading, setHeading] = useState(editing?.heading || "");
  const [text, setText] = useState(editing?.text || "");
  const [ctaLabel, setCtaLabel] = useState(editing?.ctaLabel || "Read More");
  const [ctaHref, setCtaHref] = useState(editing?.ctaHref || "/about");
  const [imageUrl, setImageUrl] = useState(editing?.imageUrl || "");
  const [active, setActive] = useState(editing ? editing.active : true);
  const [file, setFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!heading.trim() || !text.trim()) {
      setFormError("Heading and text are required.");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("label", label.trim() || "Our Story");
      fd.append("heading", heading.trim());
      fd.append("text", text.trim());
      fd.append("ctaLabel", ctaLabel.trim() || "Read More");
      fd.append("ctaHref", ctaHref.trim() || "/about");
      fd.append("imageUrl", imageUrl.trim());
      fd.append("active", String(active));
      if (file) fd.append("image", file);

      if (mode === "create") {
        await createAdminBrandStory(fd);
      } else if (editing) {
        await updateAdminBrandStory(editing.id, fd);
      }
      onClose();
      onSaved();
    } catch (err: any) {
      setFormError(err.message || "Failed to save story");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={mode === "create" ? "Add Brand Story" : `Edit “${editing?.heading || "Story"}”`}
      onClose={() => {
        if (!saving) onClose();
      }}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Label
            </label>
            <input
              type="text"
              className={inputCls}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Our Story"
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              CTA Label
            </label>
            <input
              type="text"
              className={inputCls}
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Read More"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Heading *
          </label>
          <input
            type="text"
            className={inputCls}
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="e.g. Royalty Meets Modern Tailoring"
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Text *
          </label>
          <textarea
            className={inputCls}
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell the story of your brand…"
            required
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
            placeholder="/about"
          />
        </div>

        {/* Image */}
        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Story Image
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

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="accent-white"
          />
          Active (shown on homepage)
        </label>

        {formError && <p className={fieldErrorCls}>{formError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnSecondaryCls} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={btnPrimaryCls}>
            {saving ? "Saving…" : mode === "create" ? "Create Story" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
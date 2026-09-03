"use client";

import { useRef, useState } from "react";
import Modal, { inputCls, btnPrimaryCls, btnSecondaryCls, fieldErrorCls } from "./Modal";
import {
  IMAGE_CATEGORIES,
  type ImageAsset,
  type ImageCategory,
} from "@/types/admin.types";
import { createAdminImage, updateAdminImage } from "@/lib/admin-api";

interface ImageModalProps {
  mode: "add" | "edit";
  image?: ImageAsset | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ImageModal({ mode, image, onClose, onSaved }: ImageModalProps) {
  const [name, setName] = useState(image?.name || "");
  const [alt, setAlt] = useState(image?.alt || "");
  const [category, setCategory] = useState<ImageCategory>(
    image?.category || "BANNER"
  );
  const [active, setActive] = useState(image?.active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(image?.url || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      setPreview(URL.createObjectURL(selected));
      if (!name.trim()) setName(selected.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Image name is required.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "add") {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("alt", alt.trim());
        formData.append("category", category);
        formData.append("active", String(active));
        if (file) formData.append("image", file);
        await createAdminImage(formData);
      } else if (image) {
        await updateAdminImage(image.id, {
          name: name.trim(),
          alt: alt.trim() || null,
          category,
          active,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title={mode === "add" ? "Add image" : "Edit image"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Preview */}
        <div className="flex items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="h-20 w-20 object-cover rounded border border-gray-700"
            />
          ) : (
            <div className="h-20 w-20 rounded border border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-xs">
              No image
            </div>
          )}
          <div className="flex-1 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFile}
              className="block w-full text-xs text-gray-400 file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-gray-700 file:text-white file:text-xs hover:file:bg-gray-600"
            />
            {mode === "edit" && !file && (
              <p className="text-xs text-gray-500">
                Upload a file only if you want to replace the stored image.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Name *
          </label>
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Homepage hero"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Alt text
          </label>
          <input
            className={inputCls}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Accessibility description"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Category *
          </label>
          <select
            className={inputCls}
            value={category}
            onChange={(e) => setCategory(e.target.value as ImageCategory)}
          >
            {IMAGE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 accent-white"
          />
          <span className="text-sm text-gray-200">Active (visible on site)</span>
        </label>

        {error && <p className={fieldErrorCls}>{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={btnSecondaryCls} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btnPrimaryCls} disabled={loading}>
            {loading ? "Saving..." : mode === "add" ? "Add image" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

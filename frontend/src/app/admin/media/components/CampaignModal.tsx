"use client";

import { useEffect, useState } from "react";
import Modal, { inputCls, btnPrimaryCls, btnSecondaryCls, fieldErrorCls } from "./Modal";
import type { CampaignType, ImageAsset } from "@/types/admin.types";
import {
  createAdminCampaign,
  updateAdminCampaign,
  fetchAdminImages,
} from "@/lib/admin-api";

interface CampaignModalProps {
  mode: "add" | "edit";
  campaign?: CampaignType | null;
  onClose: () => void;
  onSaved: () => void;
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function defaultWindow(): { start: string; end: string } {
  const start = new Date();
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return { start: toLocalInput(start.toISOString()), end: toLocalInput(end.toISOString()) };
}

export default function CampaignModal({ mode, campaign, onClose, onSaved }: CampaignModalProps) {
  const initial = defaultWindow();
  const [title, setTitle] = useState(campaign?.title || "");
  const [description, setDescription] = useState(campaign?.description || "");
  const [imageId, setImageId] = useState(campaign?.imageId || "");
  const [startDate, setStartDate] = useState(campaign ? toLocalInput(campaign.startDate) : initial.start);
  const [endDate, setEndDate] = useState(campaign ? toLocalInput(campaign.endDate) : initial.end);
  const [discount, setDiscount] = useState(campaign?.discount ?? 0);
  const [active, setActive] = useState(campaign?.active ?? true);

  const [images, setImages] = useState<ImageAsset[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAdminImages({ limit: 100 })
      .then((res: any) => {
        const list = (res?.data || []) as ImageAsset[];
        setImages(list);
        // Prefer the campaign's own image; otherwise default to first active
        if (!imageId) {
          const first = list.find((i) => i.active) || list[0];
          if (first) setImageId(first.id);
        }
      })
      .catch(() => setError("Could not load images for the picker."))
      .finally(() => setImagesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Title is required.";
    if (!imageId) errors.imageId = "Choose a campaign image.";
    if (!startDate) errors.startDate = "Start date is required.";
    if (!endDate) errors.endDate = "End date is required.";
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      if (isNaN(s) || isNaN(e)) {
        errors.endDate = "Invalid dates.";
      } else if (e <= s) {
        errors.endDate = "End date must be after start date.";
      }
    }
    const disc = Number(discount);
    if (isNaN(disc) || disc < 0 || disc > 100) {
      errors.discount = "Discount must be between 0 and 100%.";
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setError("");
    setLoading(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      imageId,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      discount: Number(discount),
      active,
    };

    try {
      if (mode === "add") {
        await createAdminCampaign(payload);
      } else if (campaign) {
        await updateAdminCampaign(campaign.id, payload);
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
      title={mode === "add" ? "Create campaign" : "Edit campaign"}
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Title *</label>
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Eid Sale 2026"
            />
            {fieldErrors.title && <p className={fieldErrorCls}>{fieldErrors.title}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Discount % *</label>
            <input
              className={inputCls}
              type="number"
              min={0}
              max={100}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
            {fieldErrors.discount && <p className={fieldErrorCls}>{fieldErrors.discount}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Image *</label>
          {imagesLoading ? (
            <p className="text-xs text-gray-500">Loading images…</p>
          ) : (
            <select
              className={inputCls}
              value={imageId}
              onChange={(e) => setImageId(e.target.value)}
            >
              {images.length === 0 && <option value="">No images yet — add one first</option>}
              {images.map((img) => (
                <option key={img.id} value={img.id}>
                  {img.name}
                  {!img.active ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          )}
          {fieldErrors.imageId && <p className={fieldErrorCls}>{fieldErrors.imageId}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this campaign about?"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Start date *</label>
            <input
              className={inputCls}
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {fieldErrors.startDate && <p className={fieldErrorCls}>{fieldErrors.startDate}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">End date *</label>
            <input
              className={inputCls}
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {fieldErrors.endDate && <p className={fieldErrorCls}>{fieldErrors.endDate}</p>}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 accent-white"
          />
          <span className="text-sm text-gray-200">Active campaign</span>
        </label>

        {error && <p className={fieldErrorCls}>{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={btnSecondaryCls} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btnPrimaryCls} disabled={loading || imagesLoading}>
            {loading ? "Saving…" : mode === "add" ? "Create campaign" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

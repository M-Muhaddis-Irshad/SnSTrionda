"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ActiveCampaign {
  id: string;
  title: string;
  description: string | null;
  discount: number;
  image: { id: string; name: string; url: string; alt: string | null } | null;
  startDate: string;
  endDate: string;
}

/**
 * PromoCampaigns — homepage strip of active campaigns (created/edited in
 * /admin/campaigns). Renders nothing when no campaign is live, and refreshes
 * itself when the admin broadcasts a catalog:changed event.
 */
export default function PromoCampaigns() {
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/campaigns`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCampaigns(data.data || []);
      } catch {
        // Non-blocking — banner simply stays hidden
      }
    }

    load();

    // Live refresh when an admin adds/updates/deletes a campaign
    const onCatalog = () => load();
    window.addEventListener("trionda:catalog-changed", onCatalog);
    return () => {
      cancelled = true;
      window.removeEventListener("trionda:catalog-changed", onCatalog);
    };
  }, []);

  if (campaigns.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      {campaigns.map((c) => (
        <Link
          key={c.id}
          href="/shop"
          className="group flex flex-col sm:flex-row items-stretch overflow-hidden border border-chrome-500 bg-surface hover:border-chrome-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300"
        >
          {c.image?.url ? (
            <div className="sm:w-64 lg:w-80 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image.url}
                alt={c.image.alt || c.title}
                className="h-40 sm:h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="sm:w-64 lg:w-80 shrink-0 h-40 sm:h-auto bg-chrome-900 flex items-center justify-center">
              <span className="font-display text-3xl text-muted">{c.discount}%</span>
            </div>
          )}
          <div className="flex-1 flex items-center justify-between gap-4 p-6 min-w-0">
            <div className="min-w-0">
              <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted mb-1.5">
                Limited Offer
              </p>
              <h3 className="font-display text-xl text-foreground truncate">{c.title}</h3>
              {c.description && (
                <p className="font-body text-sm text-muted mt-1 line-clamp-2">
                  {c.description}
                </p>
              )}
            </div>
            <span className="shrink-0 font-body text-sm px-4 py-2 bg-chrome-100 text-black font-medium group-hover:bg-chrome-200 transition-colors whitespace-nowrap">
              {c.discount}% Off
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
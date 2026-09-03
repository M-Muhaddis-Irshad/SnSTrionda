"use client";

// =============================================================================
// ProductDetailTabs — tabbed Description / Details / Size & Fit / Shipping &
// Returns, plus collapsible attribute rows. All content comes from real product
// data; only Shipping & Returns uses the site-wide static policy.
// =============================================================================

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/motion";

export interface DetailVariant {
  size: string | null;
  color: string | null;
  fabricType: string | null;
  sku: string;
}

interface ProductDetailTabsProps {
  description: string | null;
  variants: DetailVariant[];
  isCustomizable: boolean;
  categoryName: string;
}

const SHIPPING_POLICY = [
  "Nationwide delivery to 20+ cities across Pakistan, with charges calculated by delivery zone at checkout.",
  "Orders are dispatched within 1–2 business days; estimated delivery is shown when you select your city.",
  "Cash on Delivery (COD) is available nationwide — pay only when your order arrives.",
  "Made-to-order pieces take longer: 5–7 business days for tailoring before dispatch.",
  "Exchange or return unworn items within 7 days of delivery. Contact support to arrange a return.",
];

export default function ProductDetailTabs({
  description,
  variants,
  isCustomizable,
  categoryName,
}: ProductDetailTabsProps) {
  const [tab, setTab] = useState<"description" | "details" | "fit" | "shipping">("description");
  const [openRow, setOpenRow] = useState<string | null>("material");
  const panelRef = useRef<HTMLDivElement>(null);

  // Subtle crossfade whenever the active tab changes (pre-paint so the new
  // panel never flashes at full opacity first).
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      panel,
      { autoAlpha: 0.25, y: 8 },
      { autoAlpha: 1, y: 0, duration: 0.35, ease: "power1.out" }
    );
  }, [tab]);

  const fabrics = [...new Set(variants.map((v) => v.fabricType).filter(Boolean))] as string[];
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[];
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[];

  const tabs = [
    { id: "description" as const, label: "Description" },
    { id: "details" as const, label: "Details" },
    { id: "fit" as const, label: "Size & Fit" },
    { id: "shipping" as const, label: "Shipping & Returns" },
  ];

  // -------------------------------------------------------------------------
  // Accordion rows (material / fit / details) — populated from real data
  // -------------------------------------------------------------------------

  const accordionRows = [
    {
      id: "material",
      label: "Material",
      content: fabrics.length > 0
        ? `Crafted in ${fabrics.join(", ")}.${description ? ` ${description}` : ""}`
        : description || "Material details for this piece will be listed here as they become available.",
    },
    {
      id: "fit",
      label: "Fit & Sizing",
      content: sizes.length > 0
        ? `Available in sizes ${sizes.join(", ")}.${
            isCustomizable ? " This piece is made to order — select your measurements for a custom fit." : ""
          }`
        : isCustomizable
        ? "Made to order — provide your measurements for a custom fit."
        : "One size — see the Size & Fit tab for guidance.",
    },
    {
      id: "details",
      label: "Details",
      content: [
        `Category: ${categoryName}`,
        colors.length > 0 ? `Available colors: ${colors.join(", ")}` : null,
        isCustomizable ? "Made to order" : null,
        `${variants.length} size/color option${variants.length !== 1 ? "s" : ""} available`,
      ]
        .filter(Boolean)
        .join(" · "),
    },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap border-b border-chrome-500/70">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-3 font-body text-xs uppercase tracking-[0.2em] transition-colors ${
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div ref={panelRef} className="py-6">
        {tab === "description" && (
          <p className="font-body text-sm leading-relaxed text-muted">
            {description || "No description available for this piece yet."}
          </p>
        )}

        {tab === "details" && (
          <ul className="space-y-2 font-body text-sm text-muted">
            <li>Category: {categoryName}</li>
            {fabrics.length > 0 && <li>Fabric: {fabrics.join(", ")}</li>}
            {colors.length > 0 && <li>Colors: {colors.join(", ")}</li>}
            <li>{isCustomizable ? "Made to order — custom measurements available" : "Ready to wear"}</li>
            <li>{variants.length} size/color option{variants.length !== 1 ? "s" : ""}</li>
          </ul>
        )}

        {tab === "fit" && (
          <div className="space-y-4 font-body text-sm text-muted">
            {sizes.length > 0 ? (
              <p>Available sizes: {sizes.join(", ")}</p>
            ) : (
              <p>One size available.</p>
            )}
            <p>
              {isCustomizable
                ? "This piece is made to order. Add your measurements at purchase for a tailored fit — our atelier follows your exact specifications."
                : "Fit runs true to size. For made-to-order options, use the measurement form for a custom fit."}
            </p>
            <p className="text-xs text-chrome-400">
              Need help? Contact support and we will guide you through sizing.
            </p>
          </div>
        )}

        {tab === "shipping" && (
          <ul className="list-disc space-y-2 pl-5 font-body text-sm text-muted">
            {SHIPPING_POLICY.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Accordion attribute rows */}
      <div className="border-t border-chrome-500/70">
        {accordionRows.map((row) => {
          const open = openRow === row.id;
          return (
            <div key={row.id} className="border-b border-chrome-500/70">
              <button
                type="button"
                onClick={() => setOpenRow(open ? null : row.id)}
                aria-expanded={open}
                className="flex w-full items-center justify-between py-4 text-left"
              >
                <span className="font-body text-xs uppercase tracking-[0.25em] text-foreground">
                  {row.label}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                  className={`text-chrome-400 transition-transform ${open ? "rotate-180" : ""}`}
                >
                  <path d="m6 15 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {open && (
                <p className="pb-5 font-body text-sm leading-relaxed text-muted">
                  {row.content}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import ImagesTab from "./components/ImagesTab";
import CampaignsTab from "./components/CampaignsTab";

type TabId = "images" | "campaigns";

export default function MediaPage() {
  const [tab, setTab] = useState<TabId>("images");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Media &amp; Campaigns</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <TabButton active={tab === "images"} onClick={() => setTab("images")}>
          Images
        </TabButton>
        <TabButton active={tab === "campaigns"} onClick={() => setTab("campaigns")}>
          Campaigns
        </TabButton>
      </div>

      <div>{tab === "images" ? <ImagesTab /> : <CampaignsTab />}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-selected={active}
      className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${
        active
          ? "border-white text-white"
          : "border-transparent text-gray-500 hover:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

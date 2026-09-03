// =============================================================================
// Admin — shared TypeScript types
// =============================================================================

export type ImageCategory = "HERO" | "BANNER" | "COLLECTION" | "CAROUSEL" | "CAMPAIGN";

export const IMAGE_CATEGORIES: ImageCategory[] = [
  "HERO",
  "BANNER",
  "COLLECTION",
  "CAROUSEL",
  "CAMPAIGN",
];

export interface ImageAsset {
  id: string;
  name: string;
  url: string;
  alt?: string | null;
  category: ImageCategory;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { campaigns: number };
}

export interface ImageUsage {
  image: ImageAsset;
  usage: {
    campaigns: Array<{ id: string; title: string; active: boolean }>;
    usedByCampaigns: number;
  };
}

export interface CampaignType {
  id: string;
  title: string;
  description?: string | null;
  imageId: string;
  startDate: string;
  endDate: string;
  discount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  image?: {
    id: string;
    name: string;
    url: string;
    alt?: string | null;
  } | null;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type CampaignStatus =
  | "Active"
  | "Scheduled"
  | "Expired"
  | "Inactive";

export function campaignStatus(c: CampaignType): CampaignStatus {
  if (!c.active) return "Inactive";
  const now = new Date();
  const start = new Date(c.startDate);
  const end = new Date(c.endDate);
  if (now < start) return "Scheduled";
  if (now > end) return "Expired";
  return "Active";
}

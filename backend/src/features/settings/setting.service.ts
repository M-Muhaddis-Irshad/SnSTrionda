// =============================================================================
// Store Settings Feature — Business Logic Service
// =============================================================================
// Simple key/value store for admin-editable storefront content (contact info,
// socials, announcement bar, …). Every key listed in SETTING_KEYS is exposed
// through the public endpoint — settings are storefront-facing by design and
// never hold secrets.
// =============================================================================

import { prisma } from "../../db";

export const SETTING_KEYS = [
  "store_name",
  "store_tagline",
  "contact_email",
  "contact_phone",
  "contact_whatsapp",
  "address",
  "instagram",
  "facebook",
  "tiktok",
  "announcement_enabled",
  "announcement_text",
  "shipping_note",
  "jazzcash_account_name",
  "jazzcash_account_number",
  "jazzcash_instructions",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  store_name: "Trionda Wears",
  store_tagline: "Timeless pieces, tailored for you.",
  contact_email: "",
  contact_phone: "",
  contact_whatsapp: "",
  address: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  announcement_enabled: "false",
  announcement_text: "",
  shipping_note: "",
  jazzcash_account_name: "",
  jazzcash_account_number: "",
  jazzcash_instructions: "Send the exact amount to the account below, then upload your payment slip.",
};

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.storeSetting.findMany({
    where: { key: { in: SETTING_KEYS as unknown as string[] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value ?? ""]));
  const out: Record<string, string> = {};
  for (const key of SETTING_KEYS) {
    out[key] = map.has(key) ? map.get(key)! : DEFAULT_SETTINGS[key];
  }
  return out;
}

export async function upsertSettings(input: Record<string, unknown>): Promise<Record<string, string>> {
  const entries = Object.entries(input).filter(
    ([key]) => (SETTING_KEYS as readonly string[]).includes(key)
  );

  if (entries.length === 0) {
    throw new Error("No valid settings provided");
  }

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.storeSetting.upsert({
        where: { key },
        create: { key, value: value === null || value === undefined ? null : String(value) },
        update: { value: value === null || value === undefined ? null : String(value) },
      })
    )
  );

  return getAllSettings();
}

// =============================================================================
// Resend Configuration
// =============================================================================
// Load .env BEFORE reading process.env here — same pattern as cloudinary.ts,
// because this module can be imported before server.ts calls dotenv.config().
//
// RESEND_API_KEY is optional at boot: when it is missing the app still runs
// and password-reset emails simply fail with a logged error (the endpoint
// still returns 200 so we never leak whether an account exists).
// =============================================================================

import "dotenv/config";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export const isEmailConfigured = Boolean(apiKey);

// Verified sender. "onboarding@resend.dev" only delivers to the address that
// owns the Resend account (fine for local testing) — set RESEND_FROM to a
// domain-verified address such as "Trionda Wears <no-reply@snwears.com>".
export const RESEND_FROM =
  process.env.RESEND_FROM || "Trionda Wears <onboarding@resend.dev>";

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@snwears.com";

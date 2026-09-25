// =============================================================================
// Email Service — transactional email sending (Resend + React Email)
// =============================================================================

import { render } from "@react-email/render";
import PasswordResetEmail from "../emails/PasswordResetEmail";
import {
  resend,
  isEmailConfigured,
  RESEND_FROM,
  SUPPORT_EMAIL,
} from "../config/resend";
import { getPrimaryOrigin } from "../config/corsOrigins";

/** Must match passwordResetTokenExpiry (15 minutes). */
export const PASSWORD_RESET_OTP_MINUTES = 15;

/**
 * Absolute link into the reset page. The `token` param carries the OTP so the
 * page can prefill both email and code — the API still expects `otp`.
 */
export function buildPasswordResetUrl(email: string, otp: string): string {
  const base = getPrimaryOrigin();
  return `${base}/reset-password?email=${encodeURIComponent(
    email
  )}&token=${encodeURIComponent(otp)}`;
}

export interface SendPasswordResetArgs {
  to: string;
  name?: string | null;
  otp: string;
}

/**
 * Sends the branded reset email. Never throws — callers log and return a
 * generic 200 so an address can't be probed by response differences.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  otp,
}: SendPasswordResetArgs): Promise<{ ok: boolean; error?: string }> {
  if (!resend || !isEmailConfigured) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  try {
    const resetUrl = buildPasswordResetUrl(to, otp);
    const siteUrl = getPrimaryOrigin();

    const html = await render(
      <PasswordResetEmail
        name={name}
        otp={otp}
        resetUrl={resetUrl}
        expiresInMinutes={PASSWORD_RESET_OTP_MINUTES}
        supportEmail={SUPPORT_EMAIL}
        siteUrl={siteUrl}
      />
    );

    const text = [
      `Hi ${name || "there"},`,
      ``,
      `Your Trionda Wears password reset code is: ${otp}`,
      `It is valid for ${PASSWORD_RESET_OTP_MINUTES} minutes.`,
      ``,
      `Or reset your password directly:`,
      resetUrl,
      ``,
      `If you didn't request this, you can safely ignore this email.`,
      `Need help? ${SUPPORT_EMAIL}`,
    ].join("\n");

    const { error } = await resend.emails.send({
      from: RESEND_FROM,
      to,
      subject: "Reset your Trionda Wears password",
      html,
      text,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Unknown email error" };
  }
}

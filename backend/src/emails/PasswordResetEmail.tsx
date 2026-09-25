// =============================================================================
// Password Reset Email — transactional template (React Email)
// =============================================================================
// Rendered server-side by @react-email/render and sent through Resend.
// Dark theme mirrors the snwears.com /login page so the email looks like it
// belongs to the same product. All styles are inline (email-client safe) with
// a small <style> block in <Head> for the mobile media query.
// =============================================================================

import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const LOGO_URL =
  "https://res.cloudinary.com/gbor3ceh/image/upload/v1788285597/trionda-icon-mark.png";

const COLORS = {
  page: "#0b0b0c",
  card: "#141416",
  border: "#2a2a2e",
  text: "#f4f4f5",
  muted: "#a1a1aa",
  gold: "#c9a227",
  goldSoft: "#1d1a10",
};

export interface PasswordResetEmailProps {
  /** Recipient's display name (falls back to "there"). */
  name?: string | null;
  /** The 6-digit code the user must type. */
  otp: string;
  /** Absolute link to the reset page (prefills email + code). */
  resetUrl: string;
  /** Defaults to 15 — matches passwordResetTokenExpiry. */
  expiresInMinutes?: number;
  /** Shown in the footer. Defaults to support@snwears.com. */
  supportEmail?: string;
  /** Shown in the footer. Defaults to snwears.com. */
  siteUrl?: string;
}

export default function PasswordResetEmail({
  name,
  otp,
  resetUrl,
  expiresInMinutes = 15,
  supportEmail = "support@snwears.com",
  siteUrl = "https://snwears.com",
}: PasswordResetEmailProps) {
  const greeting = name ? name : "there";

  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
          fallbackFontFamily={["Arial", "Helvetica"]}
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
            format: "woff2",
          }}
        />
        <style>{`
          @media only screen and (max-width: 480px) {
            .tw-card { width: 100% !important; padding: 28px 20px !important; }
            .tw-otp  { font-size: 34px !important; letter-spacing: 8px !important; }
            .tw-cta  { width: 100% !important; }
            .tw-head { font-size: 22px !important; }
          }
        `}</style>
      </Head>
      <Preview>
        {`Your Trionda Wears password reset code is ${otp} — valid for ${expiresInMinutes} minutes.`}
      </Preview>

      <Body style={{ backgroundColor: COLORS.page, margin: 0, padding: "0" }}>
        {/* Brand banner */}
        <Section
          style={{
            backgroundColor: COLORS.page,
            padding: "28px 16px 8px",
            textAlign: "center",
          }}
        >
          <Img
            src={LOGO_URL}
            alt="Trionda Wears"
            width={56}
            height={56}
            style={{
              display: "inline-block",
              borderRadius: "10px",
              margin: "0 auto",
            }}
          />
          <Text
            style={{
              color: COLORS.text,
              fontSize: "13px",
              letterSpacing: "6px",
              fontWeight: 600,
              margin: "14px 0 0",
              textTransform: "uppercase",
            }}
          >
            TRIONDA WEARS
          </Text>
        </Section>

        <Container
          className="tw-card"
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px",
            padding: "40px 32px",
            maxWidth: "560px",
          }}
        >
          <Heading
            className="tw-head"
            style={{
              color: COLORS.text,
              fontSize: "26px",
              lineHeight: "1.25",
              fontWeight: 600,
              margin: "0 0 18px",
            }}
          >
            Reset your password
          </Heading>

          <Text style={{ color: COLORS.muted, fontSize: "15px", lineHeight: "1.65", margin: "0 0 24px" }}>
            Hi {greeting}, we received a request to reset the password for
            your Trionda Wears account. Enter the code below to continue.
          </Text>

          {/* OTP */}
          <Section
            style={{
              backgroundColor: COLORS.goldSoft,
              border: `1px dashed ${COLORS.gold}`,
              borderRadius: "10px",
              padding: "22px 16px",
              textAlign: "center",
              margin: "0 0 22px",
            }}
          >
            <Text
              style={{
                color: COLORS.muted,
                fontSize: "11px",
              letterSpacing: "3px",
                margin: "0 0 10px",
                textTransform: "uppercase",
              }}
            >
              Your code
            </Text>
            <div
              className="tw-otp"
              style={{
                color: COLORS.gold,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "42px",
                fontWeight: 600,
                letterSpacing: "12px",
                lineHeight: "1.1",
                margin: "0",
                textAlign: "center",
              }}
            >
              {otp}
            </div>
            <Text style={{ color: COLORS.muted, fontSize: "13px", margin: "14px 0 0" }}>
              Valid for {expiresInMinutes} minutes
            </Text>
          </Section>

          <Text style={{ color: COLORS.muted, fontSize: "11px", letterSpacing: "3px", margin: "0 0 14px", textAlign: "center", textTransform: "uppercase" }}>
            or
          </Text>

          <Section style={{ textAlign: "center", margin: "0 0 26px" }}>
            <Button
              className="tw-cta"
              href={resetUrl}
              style={{
                backgroundColor: COLORS.gold,
                borderRadius: "8px",
                color: COLORS.page,
                display: "inline-block",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "1px",
                padding: "14px 28px",
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              Reset your password
            </Button>
          </Section>

          <Hr style={{ border: "none", borderTop: `1px solid ${COLORS.border}`, margin: "8px 0 22px" }} />

          <Text style={{ color: COLORS.muted, fontSize: "13px", lineHeight: "1.7", margin: "0 0 8px" }}>
            If you didn&apos;t request this you can safely ignore this email —
            your password won&apos;t change until you enter the code. The code
            can only be used once.
          </Text>

          <Text style={{ color: COLORS.muted, fontSize: "13px", lineHeight: "1.7", margin: "0" }}>
            Need a hand? Email{" "}
            <Link
              href={`mailto:${supportEmail}`}
              style={{ color: COLORS.gold, textDecoration: "underline" }}
            >
              {supportEmail}
            </Link>
          </Text>
        </Container>

        {/* Footer */}
        <Section style={{ padding: "26px 16px 40px", textAlign: "center" }}>
          <Text style={{ color: COLORS.text, fontSize: "12px", letterSpacing: "4px", fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase" }}>
            TRIONDA WEARS
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: "12px", lineHeight: "1.7", margin: "0 0 10px" }}>
            Luxury menswear &amp; made-to-order clothing
            <br />
            <Link href={siteUrl} style={{ color: COLORS.muted, textDecoration: "underline" }}>
              {siteUrl.replace(/^https?:\/\//, "")}
            </Link>
            {" · "}
            <Link
              href={`mailto:${supportEmail}`}
              style={{ color: COLORS.muted, textDecoration: "underline" }}
            >
              {supportEmail}
            </Link>
          </Text>
          <Text style={{ color: "#71717a", fontSize: "11px", lineHeight: "1.7", margin: "0" }}>
            You received this because a password reset was requested for your
            account.
            <br />
            <Link
              href={`${siteUrl}/account`}
              style={{ color: "#71717a", textDecoration: "underline" }}
            >
              Manage email preferences
            </Link>
          </Text>
        </Section>
      </Body>
    </Html>
  );
}

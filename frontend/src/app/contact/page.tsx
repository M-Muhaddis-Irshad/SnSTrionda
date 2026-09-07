"use client";

import Link from "next/link";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Contact Page — contact information + placeholder contact form.
// The form is client-side only for now (no backend hook-up yet).
// ---------------------------------------------------------------------------

const CONTACT_DETAILS = [
  { label: "Email", value: "support@triondawears.com", href: "mailto:support@triondawears.com" },
  { label: "Phone / WhatsApp", value: "+92 300 0000000", href: "tel:+923000000000" },
  { label: "Address", value: "Lahore, Pakistan", href: undefined },
  { label: "Hours", value: "Mon – Sat, 10:00 AM – 7:00 PM", href: undefined },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="page-main">
      <div className="page-container--narrow">
        <h1 className="shop-page-heading">Contact Us</h1>
        <div className="section-divider" />

        <p className="mt-8 font-body text-sm leading-relaxed text-muted">
          Questions about an order, measurements, or a custom piece? Our team
          is happy to help. Reach out below and we will get back to you as soon
          as we can.
        </p>

        {/* Contact details */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {CONTACT_DETAILS.map((detail) => (
            <div
              key={detail.label}
              className="border border-chrome-500 bg-surface p-5"
            >
              <p className="text-xs font-body uppercase tracking-[0.15em] text-chrome-400">
                {detail.label}
              </p>
              {detail.href ? (
                <Link
                  href={detail.href}
                  className="mt-1 block font-body text-sm text-foreground transition-colors hover:text-chrome-200"
                >
                  {detail.value}
                </Link>
              ) : (
                <p className="mt-1 font-body text-sm text-foreground">
                  {detail.value}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div className="mt-12 border border-chrome-500 bg-surface p-6 sm:p-8">
          <h2 className="font-display text-lg tracking-[0.1em] text-foreground">
            Send Us a Message
          </h2>

          {submitted ? (
            <div className="mt-6 border border-chrome-500 px-5 py-4">
              <p className="font-body text-sm text-chrome-200">
                Thank you — your message has been noted. Our team will respond
                shortly. (Form is a placeholder and does not submit anywhere
                yet.)
              </p>
            </div>
          ) : (
            <form
              className="mt-6 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted">
                    NAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    className="mt-2 h-11 w-full border border-chrome-500 bg-background px-3 font-body text-sm text-foreground placeholder:text-chrome-400 focus:border-chrome-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="mt-2 h-11 w-full border border-chrome-500 bg-background px-3 font-body text-sm text-foreground placeholder:text-chrome-400 focus:border-chrome-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-muted">
                  MESSAGE
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="How can we help?"
                  className="mt-2 w-full border border-chrome-500 bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-chrome-400 focus:border-chrome-300 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-white py-3 font-body text-sm font-semibold uppercase tracking-[0.15em] text-black transition-colors hover:bg-gray-200 sm:w-auto sm:px-10"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
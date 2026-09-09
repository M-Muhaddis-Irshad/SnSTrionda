"use client";

// =============================================================================
// InstallPrompt — custom PWA install prompt.
//
//   • Listens for the browser's `beforeinstallprompt` event and captures it,
//     suppressing the native mini-infobar so we can show our own UI.
//   • Renders a dark card with the brand mark, three feature rows, an
//     "Install App" (primary) and "Not Now" (outlined) button, plus an X close.
//   • "Install App" calls the deferred prompt() — the real browser install flow.
//   • Dismissal/install sets BOTH:
//       - localStorage `trionda:install-prompt-seen` → permanent, never show again
//       - sessionStorage `trionda:install-prompt-session` → prevents re-show
//         within the same browser tab/session (resets on tab close/reopen).
//   • The event handler checks BOTH flags before showing, so even if
//     beforeinstallprompt re-fires across client-side navigations, the
//     prompt won't reappear.
//   • Browsers that never fire `beforeinstallprompt` (e.g. iOS Safari) simply
//     render nothing — this component is hidden entirely there by design.
// =============================================================================

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Feature rows shown inside the card.
const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
    ),
    title: "Lightning-fast access",
    description: "Launch straight from your home screen.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v18M3 12h18" />
      </svg>
    ),
    title: "Add to home screen",
    description: "One tap away, like a native app.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a7 7 0 0 0-6.94 6.1A4.5 4.5 0 0 0 5.5 17H18a4.5 4.5 0 0 0 .44-8.98A7 7 0 0 0 12 2z" />
        <path d="m8 14 4-4 4 4" />
      </svg>
    ),
    title: "Offline-ready experience",
    description: "Browse the app shell even without a connection.",
  },
];

// Permanent "seen" flag — once set in localStorage, never show again across sessions.
const SEEN_KEY = "trionda:install-prompt-seen";
// Session flag — prevents re-show within same tab (resets on tab close/reopen).
const SESSION_KEY = "trionda:install-prompt-session";
// Legacy key for migration.
const OLD_DISMISS_KEY = "trionda:install-dismissed-at";

// Minimal typing — BeforeInstallPromptEvent isn't in older TS libs.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** Returns true if the prompt should be blocked (already seen or shown this session). */
function isPromptBlocked(): boolean {
  try {
    if (localStorage.getItem(SEEN_KEY)) return true;
    if (sessionStorage.getItem(SESSION_KEY)) return true;
  } catch {
    // localStorage/sessionStorage unavailable — allow
  }
  return false;
}

export default function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const dismissedRef = useRef(false);

  // Permanent "seen" guard + session flag: if the prompt was ever
  // dismissed/installed, or already shown this session, never show again.
  useEffect(() => {
    try {
      if (localStorage.getItem(SEEN_KEY)) {
        dismissedRef.current = true;
        return;
      }
      if (sessionStorage.getItem(SESSION_KEY)) {
        dismissedRef.current = true;
        return;
      }
      // Migrate old 7-day dismissal → permanent seen
      const oldTs = Number(localStorage.getItem(OLD_DISMISS_KEY) || 0);
      if (oldTs) {
        localStorage.setItem(SEEN_KEY, "1");
        localStorage.removeItem(OLD_DISMISS_KEY);
        dismissedRef.current = true;
      }
    } catch {
      // localStorage unavailable — allow the prompt
    }
  }, []);

  // Capture the browser's install event. Checks BOTH flags on every fire.
  useEffect(() => {
    if (dismissedRef.current) return;

    const onBeforeInstallPrompt = (e: Event) => {
      // Double-check flags on every event fire (prevents re-show after dismiss)
      if (isPromptBlocked()) {
        dismissedRef.current = true;
        return;
      }
      // Suppress the native mini-infobar — we render our own card.
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    // Fired when the app is actually installed (via prompt or manually).
    const onAppInstalled = () => {
      try {
        localStorage.setItem(SEEN_KEY, "1");
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {}
      setVisible(false);
      setDeferredEvent(null);
      dismissedRef.current = true;
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const hide = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    setVisible(false);
    setDeferredEvent(null);
    dismissedRef.current = true;
  };

  const handleInstall = async () => {
    if (!deferredEvent) return;
    setInstalling(true);
    try {
      await deferredEvent.prompt();
      const choice = await deferredEvent.userChoice;
      // Either way we're done — if accepted the appinstalled event cleans up.
      if (choice.outcome === "dismissed") hide();
    } finally {
      setInstalling(false);
    }
  };

  const handleNotNow = () => {
    hide();
  };

  // No event captured (unsupported browser, already installed, dismissed this session,
  // or permanently dismissed) → render nothing at all.
  if (!visible || !deferredEvent) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Install Trionda Wears"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={hide}
        aria-hidden="true"
      />

      {/* Card — bottom sheet on mobile, centered dialog ≥ sm */}
      <div className="relative z-10 w-full border border-chrome-500 bg-surface shadow-2xl sm:max-w-md">
        {/* Close (X) — top right */}
        <button
          type="button"
          onClick={hide}
          aria-label="Close install prompt"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 rounded-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col gap-5 p-6 sm:p-8">
          {/* Brand mark + heading */}
          <div className="flex items-center gap-4 pr-8">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-chrome-500 bg-background">
              <Image
                src="/logo/trionda-icon-mark.png"
                alt="Trionda Wears"
                width={48}
                height={32}
                className="h-8 w-auto"
              />
            </div>
            <div>
              <h2 className="font-display text-lg tracking-[0.15em] text-foreground">
                INSTALL TRIONDA WEARS
              </h2>
              <p className="mt-1 text-sm text-muted">
                Get the full experience on your home screen.
              </p>
            </div>
          </div>

          {/* Feature rows */}
          <ul className="flex flex-col gap-3">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-chrome-500 text-foreground">
                  {feature.icon}
                </span>
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    {feature.title}
                  </span>
                  <span className="block text-xs text-muted">
                    {feature.description}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              className="flex flex-1 items-center justify-center gap-2 bg-chrome-100 px-5 py-3 text-sm font-medium tracking-wide text-background transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 disabled:opacity-60"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              {installing ? "Installing…" : "Install App"}
            </button>
            <button
              type="button"
              onClick={handleNotNow}
              className="flex flex-1 items-center justify-center border border-chrome-400 px-5 py-3 text-sm font-medium tracking-wide text-foreground transition-colors hover:border-chrome-200 hover:text-chrome-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

// Module-level: initialize() fires exactly once per page load.
// renderButton() fires on every component mount independently.
let gsiInitialized = false;

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
}

export default function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  const btnRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !btnRef.current) return;

    let disposed = false;

    const poll = setInterval(() => {
      if (disposed) { clearInterval(poll); return; }
      if (!window.google?.accounts?.id || !btnRef.current) return;

      clearInterval(poll);

      // Initialize once globally (first mount only)
      if (!gsiInitialized) {
        gsiInitialized = true;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential: string }) => {
            if (response.credential) {
              onSuccessRef.current(response.credential);
            }
          },
        });
      }

      // Render button into THIS mount's DOM ref (every mount)
      if (!disposed && btnRef.current) {
        const containerWidth = btnRef.current.offsetWidth || 300;

        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: containerWidth,
          text: 'continue_with',
        });

        // GSI sets its own inline width on the iframe that may differ from
        // what we requested. Force the iframe to fill the full container
        // width by overwriting its inline style after it renders.
        const forceWidth = () => {
          if (disposed || !btnRef.current) return;
          const iframe = btnRef.current.querySelector('iframe');
          if (!iframe) return;
          const w = btnRef.current.offsetWidth;
          if (w > 0) {
            iframe.style.width = w + 'px';
            iframe.style.maxWidth = '100%';
            iframe.style.height = '48px';
            iframe.style.margin = '0';
            iframe.style.position = 'static';
          }
        };

        // Run multiple times to catch GSI's async style updates
        forceWidth();
        setTimeout(forceWidth, 300);
        setTimeout(forceWidth, 800);
        setTimeout(forceWidth, 2000);

        // Also watch for GSI modifying the iframe after load
        const iframe = btnRef.current.querySelector('iframe');
        if (iframe) {
          iframe.addEventListener('load', () => setTimeout(forceWidth, 100), { once: true });
        }
      }
    }, 100);

    return () => { disposed = true; clearInterval(poll); };
  }, [onSuccess]);

  return (
    <div className="google-button-container">
      <div ref={btnRef} className="w-full flex justify-center min-h-[44px]" />
    </div>
  );
}

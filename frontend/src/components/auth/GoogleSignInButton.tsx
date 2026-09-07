'use client';

import { useEffect, useRef } from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

// Module-level singleton: survives component unmount/remount across
// client-side navigation (e.g. /login → /signup → /login).
// Only ONE initialize() call per full page load, regardless of how
// many times this component mounts.
let gsiInitialized = false;

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
}

export default function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || gsiInitialized) return;

    const checkGoogle = setInterval(() => {
      if (window.google?.accounts?.id && btnRef.current && !gsiInitialized) {
        clearInterval(checkGoogle);
        gsiInitialized = true;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential: string }) => {
            if (response.credential) {
              onSuccess(response.credential);
            }
          },
        });
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: btnRef.current.offsetWidth,
          text: 'continue_with',
        });
      }
    }, 100);

    return () => clearInterval(checkGoogle);
  }, [onSuccess]);

  return (
    <div className="google-button-container">
      <div ref={btnRef} className="w-full flex justify-center min-h-[44px]" />
    </div>
  );
}

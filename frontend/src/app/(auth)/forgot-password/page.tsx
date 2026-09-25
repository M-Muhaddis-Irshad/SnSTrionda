'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const LOGIN_BG = 'https://res.cloudinary.com/gbor3ceh/image/upload/v1788284310/trionda-wears/auth/auth-login.jpg';
const LOGO_URL = 'https://res.cloudinary.com/gbor3ceh/image/upload/v1788285597/trionda-icon-mark.png';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- Step 1: request a reset code ---------- */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldError('');

    const trimmed = email.trim();
    if (!emailRegex.test(trimmed)) {
      setFieldError('Enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 429 = rate limited; the API's message is the most useful text here.
        setError(data.message || data.error || 'Something went wrong. Please try again.');
        setIsLoading(false);
        return;
      }

      setSentTo(trimmed);
      setIsLoading(false);
    } catch {
      setError('Could not connect to the server. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left: Background Image with Overlay */}
      <div className="auth-image-panel">
        <Image
          src={LOGIN_BG}
          alt="Login Background"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="auth-image-overlay" />
        <div className="auth-branding">
          <Image
            src={LOGO_URL}
            alt="Trionda Logo"
            width={72}
            height={48}
            className="rounded h-12 w-[72px]"
            unoptimized
          />
          <span className="auth-branding-text">TRIONDA WEARS</span>
        </div>
      </div>

      {/* Right: Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          {/* Logo (mobile only) */}
          <div className="auth-logo-mobile">
            <Image src={LOGO_URL} alt="Trionda Logo" width={54} height={36} className="rounded h-9 w-[54px]" unoptimized />
          </div>

          {/* Desktop logo */}
          <div className="auth-logo-desktop">
            <Image src={LOGO_URL} alt="Trionda Logo" width={72} height={48} className="rounded h-12 w-[72px]" unoptimized />
          </div>

          <div className="auth-heading-group">
            <p className="auth-subheading">ACCOUNT RECOVERY</p>
            <h1 className="auth-title">FORGOT PASSWORD</h1>
            <p className="auth-description">
              Enter your email and we&apos;ll send you a 6-digit code to reset your password.
            </p>
          </div>

          {sentTo ? (
            /* ---------- Success: code sent ---------- */
            <div className="space-y-6">
              <div className="bg-emerald-500/10 border border-emerald-500/60 text-emerald-300 px-4 py-3 rounded text-sm">
                Check <span className="font-semibold">{sentTo}</span> for your 6-digit
                code. It&apos;s valid for 15 minutes.
              </div>

              <Link
                href={`/reset-password?email=${encodeURIComponent(sentTo)}`}
                className="auth-submit-btn"
              >
                ENTER YOUR CODE
              </Link>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setSentTo('')}
                  className="auth-forgot-link bg-transparent p-0"
                >
                  Use a different email
                </button>
                <Link href="/login" className="auth-forgot-link">
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email */}
              <div>
                <label className="auth-field" htmlFor="forgot-email">EMAIL ADDRESS</label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  className={`auth-input ${fieldError ? 'auth-input--error' : ''}`}
                  autoComplete="email"
                  autoFocus
                />
                {fieldError && <p className="auth-error">{fieldError}</p>}
              </div>

              {/* Error */}
              {error && <div className="auth-error-banner">{error}</div>}

              {/* Submit */}
              <button type="submit" disabled={isLoading} className="auth-submit-btn">
                {isLoading && <div className="auth-spinner--small" />}
                {isLoading ? 'SENDING CODE...' : 'SEND RESET CODE'}
              </button>

              {/* Back to login */}
              <p className="auth-switch-text">
                REMEMBERED YOUR PASSWORD?{' '}
                <Link href="/login" className="auth-switch-link">SIGN IN</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

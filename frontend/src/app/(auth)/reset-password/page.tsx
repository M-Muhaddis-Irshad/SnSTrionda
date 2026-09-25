'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const LOGIN_BG = 'https://res.cloudinary.com/gbor3ceh/image/upload/v1788284310/trionda-wears/auth/auth-login.jpg';
const LOGO_URL = 'https://res.cloudinary.com/gbor3ceh/image/upload/v1788285597/trionda-icon-mark.png';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/* ---------- Step 2: enter code + new password ---------- */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // The reset link in the email carries ?email=...&token=<OTP> so both fields
  // are prefilled when the user clicks through instead of typing the code.
  const prefillEmail = searchParams.get('email') || '';
  const prefillOtp = searchParams.get('token') || '';

  const [email, setEmail] = useState(prefillEmail);
  const [otp, setOtp] = useState(prefillOtp);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const requirements = {
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasMinLength: newPassword.length >= 8,
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!emailRegex.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (!/^\d{6}$/.test(otp.trim())) errs.otp = 'Enter the 6-digit code from your email.';
    if (!passwordRegex.test(newPassword)) {
      errs.password = 'Password must be 8+ characters with an uppercase letter and a number.';
    }
    if (newPassword !== confirmPassword) errs.confirm = 'Passwords do not match.';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || 'Could not reset the password. Please try again.');
        setIsLoading(false);
        return;
      }

      // Password changed → any session this browser still holds is dead now
      // (server also bumped tokenVersion). Drop it, then send the user to
      // /login with a confirmation banner.
      clearAuth();
      router.push('/login?reset=1');
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
      <div className="auth-form-panel auth-form-panel--scrollable">
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
            <h1 className="auth-title">RESET PASSWORD</h1>
            <p className="auth-description">
              Enter the 6-digit code we emailed you, then choose a new password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form auth-form--compact">
            {/* Email */}
            <div>
              <label className="auth-field auth-field--compact" htmlFor="reset-email">EMAIL ADDRESS</label>
              <input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`auth-input auth-input--small ${fieldErrors.email ? 'auth-input--error' : ''}`}
                autoComplete="email"
              />
              {fieldErrors.email && <p className="auth-error auth-error--inline">{fieldErrors.email}</p>}
            </div>

            {/* OTP */}
            <div>
              <label className="auth-field auth-field--compact" htmlFor="reset-otp">6-DIGIT CODE</label>
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`auth-input auth-input--small text-center ${fieldErrors.otp ? 'auth-input--error' : ''}`}
                style={{ letterSpacing: '0.6em' }}
              />
              {fieldErrors.otp && <p className="auth-error auth-error--inline">{fieldErrors.otp}</p>}
            </div>

            {/* New password */}
            <div>
              <label className="auth-field auth-field--compact" htmlFor="reset-password">NEW PASSWORD</label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`auth-input auth-input--small auth-input--with-icon ${fieldErrors.password ? 'auth-input--error' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-input-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {newPassword && (
                <div className="auth-password-strength">
                  <p className="auth-password-strength-list">
                    <span className={`auth-strength-item ${requirements.hasUpperCase ? 'auth-strength-pass' : 'auth-strength-fail'}`}>
                      {requirements.hasUpperCase ? <Check size={14} /> : <X size={14} />}
                      <span>Uppercase (A-Z)</span>
                    </span>
                    <span className={`auth-strength-item ${requirements.hasLowerCase ? 'auth-strength-pass' : 'auth-strength-fail'}`}>
                      {requirements.hasLowerCase ? <Check size={14} /> : <X size={14} />}
                      <span>Lowercase (a-z)</span>
                    </span>
                    <span className={`auth-strength-item ${requirements.hasNumber ? 'auth-strength-pass' : 'auth-strength-fail'}`}>
                      {requirements.hasNumber ? <Check size={14} /> : <X size={14} />}
                      <span>Number (0-9)</span>
                    </span>
                    <span className={`auth-strength-item ${requirements.hasMinLength ? 'auth-strength-pass' : 'auth-strength-fail'}`}>
                      {requirements.hasMinLength ? <Check size={14} /> : <X size={14} />}
                      <span>8 characters</span>
                    </span>
                  </p>
                </div>
              )}

              {fieldErrors.password && <p className="auth-error auth-error--inline">{fieldErrors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="auth-field auth-field--compact" htmlFor="reset-confirm">CONFIRM NEW PASSWORD</label>
              <div className="relative">
                <input
                  id="reset-confirm"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat the password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`auth-input auth-input--small auth-input--with-icon ${fieldErrors.confirm ? 'auth-input--error' : ''}`}
                  autoComplete="new-password"
                />
              </div>
              {fieldErrors.confirm && <p className="auth-error auth-error--inline">{fieldErrors.confirm}</p>}
            </div>

            {/* Error */}
            {error && <div className="auth-error-banner auth-error-banner--small">{error}</div>}

            {/* Submit */}
            <button type="submit" disabled={isLoading} className="auth-submit-btn auth-submit-btn--small">
              {isLoading && <div className="auth-spinner--small" />}
              {isLoading ? 'RESETTING...' : 'RESET PASSWORD'}
            </button>

            {/* Back links */}
            <p className="auth-switch-text">
              <Link href="/forgot-password" className="auth-switch-link">RESEND CODE</Link>
              {' · '}
              <Link href="/login" className="auth-switch-link">BACK TO SIGN IN</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page (Suspense wrapper required for useSearchParams) ---------- */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-loading">
          <div className="auth-loading-inner">
            <div className="auth-spinner" />
            <p className="auth-loading-text">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

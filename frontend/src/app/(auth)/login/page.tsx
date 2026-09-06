'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import TermsConditionsModal from '@/components/modals/TermsConditionsModal';

const LOGIN_BG = 'https://res.cloudinary.com/gbor3ceh/image/upload/v1788284310/trionda-wears/auth/auth-login.jpg';
const LOGO_URL = 'https://res.cloudinary.com/gbor3ceh/image/upload/v1788285597/trionda-icon-mark.png';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

interface LoginFormInputs {
  email: string;
  password: string;
  rememberMe: boolean;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- Google button renderer ---------- */
function GoogleSignInButton({ onSuccess }: { onSuccess: (credential: string) => void }) {
  const btnRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || rendered.current) return;

    const checkGoogle = setInterval(() => {
      if (window.google?.accounts?.id && btnRef.current) {
        clearInterval(checkGoogle);
        rendered.current = true;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential: string }) => onSuccess(response.credential),
        });
        window.google.accounts.id.renderButton(btnRef.current, {
          // Google's official dark variant — matches the site's black theme
          // (the avatar+email pill in the reference is Google's native One Tap
          // UI, which only renders via google.accounts.id.prompt() — it is NOT
          // something a rendered button or custom button can replicate).
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
      <div ref={btnRef} className="w-full" />
    </div>
  );
}

/* ---------- Login Form ---------- */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const setAuth = useAuthStore((s) => s.setAuth);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTCModal, setShowTCModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({ mode: 'onSubmit' });

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.message || result.error || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      setAuth(result.user, result.accessToken, result.refreshToken);

      if (result.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('Could not connect to server. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.message || result.error || 'Google login failed');
        setIsLoading(false);
        return;
      }

      setAuth(result.user, result.accessToken, result.refreshToken);

      if (result.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('Google login failed. Please try again.');
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
            width={90}
            height={60}
            className="rounded h-[60px] w-[90px]"
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
            <Image src={LOGO_URL} alt="Trionda Logo" width={54} height={36} className="rounded h-[36px] w-[54px]" unoptimized />
          </div>

          {/* Desktop logo */}
          <div className="auth-logo-desktop">
            <Image src={LOGO_URL} alt="Trionda Logo" width={72} height={48} className="rounded h-12 w-[72px]" unoptimized />
          </div>

          <div className="auth-heading-group">
            <p className="auth-subheading">WELCOME BACK</p>
            <h1 className="auth-title">SIGN IN</h1>
            <p className="auth-description">Sign in to your Trionda Wears account to continue.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            {/* Email */}
            <div>
              <label className="auth-field">EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: emailRegex, message: 'Invalid email format' },
                })}
                className={`auth-input ${errors.email ? 'auth-input--error' : ''}`}
              />
              {errors.email && <p className="auth-error">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="auth-field">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password', { required: 'Password is required' })}
                  className={`auth-input auth-input--with-icon ${errors.password ? 'auth-input--error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-input-toggle"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="auth-error">{errors.password.message}</p>}
            </div>

            {/* Remember Me */}
            <div className="auth-checkbox-row">
              <label className="auth-checkbox-label">
                <input type="checkbox" {...register('rememberMe')} className="auth-checkbox" />
                <span className="auth-checkbox-text">Remember me</span>
              </label>
              <a href="/forgot-password" className="auth-forgot-link">Forgot password?</a>
            </div>

            {/* Error */}
            {error && <div className="auth-error-banner">{error}</div>}

            {/* Submit */}
            <button type="submit" disabled={isLoading} className="auth-submit-btn">
              {isLoading && <div className="auth-spinner--small" />}
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">OR</span>
              <div className="auth-divider-line" />
            </div>

            {/* Google */}
            <GoogleSignInButton onSuccess={handleGoogleSuccess} />

            {/* Terms link — opens the T&C modal, no navigation */}
            <p className="auth-terms-text mt-6 text-center">
              By signing in you agree to our{' '}
              <button
                type="button"
                onClick={() => setShowTCModal(true)}
                className="auth-terms-link cursor-pointer bg-transparent p-0"
              >
                Terms &amp; Conditions
              </button>
            </p>

            {/* Signup Link */}
            <p className="auth-switch-text">
              NEW TO TRIONDA WEARS?{' '}
              <a href="/signup" className="auth-switch-link">CREATE AN ACCOUNT</a>
            </p>
          </form>

          {/* Terms & Conditions modal */}
          <TermsConditionsModal
            isOpen={showTCModal}
            onClose={() => setShowTCModal(false)}
          />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}

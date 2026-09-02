'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

const LOGIN_BG = 'https://res.cloudinary.com/gbor3ceh/image/upload/v1788284310/trionda-wears/auth/auth-login.jpg';
const LOGO_URL = 'https://res.cloudinary.com/gbor3ceh/image/upload/v1788285597/trionda-icon-mark.png';

interface LoginFormInputs {
  email: string;
  password: string;
  rememberMe: boolean;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/shop';

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    mode: 'onSubmit',
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setIsLoading(false);
    } else if (result?.ok) {
      router.push(callbackUrl);
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
            height={90}
            className="rounded"
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
            <Image
              src={LOGO_URL}
              alt="Trionda Logo"
              width={56}
              height={56}
              className="rounded"
              unoptimized
            />
          </div>

          {/* Desktop logo */}
          <div className="auth-logo-desktop">
            <Image
              src={LOGO_URL}
              alt="Trionda Logo"
              width={48}
              height={48}
              className="rounded"
              unoptimized
            />
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
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="auth-checkbox"
                />
                <span className="auth-checkbox-text">Remember me</span>
              </label>
              <a href="/forgot-password" className="auth-forgot-link">
                Forgot password?
              </a>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-error-banner">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="auth-submit-btn"
            >
              {isLoading && (
                <div className="auth-spinner--small" />
              )}
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">OR</span>
              <div className="auth-divider-line" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl })}
              className="auth-google-btn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              CONTINUE WITH GOOGLE
            </button>

            {/* Signup Link */}
            <p className="auth-switch-text">
              NEW TO TRIONDA WEARS?{' '}
              <a href="/signup" className="auth-switch-link">
                CREATE AN ACCOUNT
              </a>
            </p>
          </form>
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

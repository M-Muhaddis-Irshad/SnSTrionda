'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import TermsConditionsModal from '@/components/modals/TermsConditionsModal';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import Link from 'next/link';

const SIGNUP_BG = 'https://res.cloudinary.com/gbor3ceh/image/upload/v1788373850/ChatGPT_Image_Sep_2_2026_11_27_48_PM.png';
const LOGO_URL = 'https://res.cloudinary.com/gbor3ceh/image/upload/v1788285597/trionda-icon-mark.png';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface SignupFormInputs {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/* ---------- Signup Form ---------- */
export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTCModal, setShowTCModal] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasMinLength: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<SignupFormInputs>({ mode: 'onSubmit' });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  useEffect(() => {
    if (password) {
      setPasswordStrength({
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasMinLength: password.length >= 8,
      });
    }
  }, [password]);

  const onSubmit = async (data: SignupFormInputs) => {
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!passwordRegex.test(data.password)) {
      setError('Password must meet all requirements');
      return;
    }
    if (!emailRegex.test(data.email)) {
      setError('Invalid email format');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const registerRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerData.message || registerData.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Auto-login
      const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        setError('Account created but login failed. Please sign in manually.');
        setIsLoading(false);
        return;
      }

      setAuth(loginData.user, loginData.accessToken, loginData.refreshToken);
      router.push('/shop');
    } catch {
      setError('An error occurred during registration');
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
        setError(result.message || result.error || 'Google sign-up failed');
        setIsLoading(false);
        return;
      }

      setAuth(result.user, result.accessToken, result.refreshToken);
      router.push('/shop');
    } catch {
      setError('Google sign-up failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left: Background Image with Overlay */}
      <div className="auth-image-panel">
        <Image
          src={SIGNUP_BG}
          alt="Signup Background"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="auth-image-overlay" />
        <div className="auth-branding">
          <Image src={LOGO_URL} alt="Trionda Logo" width={48} height={32} className="rounded h-8 w-12" unoptimized />
          <span className="auth-branding-text">TRIONDA WEARS</span>
        </div>
      </div>

      {/* Right: Form */}
      <div className="auth-form-panel auth-form-panel--scrollable">
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
            <p className="auth-subheading">JOIN THE ATELIER</p>
            <h1 className="auth-title">CREATE ACCOUNT</h1>
            <p className="auth-description">Create your Trionda Wears account and discover the collection.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form auth-form--compact">
            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="auth-field auth-field--compact">FIRST NAME</label>
                <input
                  type="text"
                  placeholder="First name"
                  {...register('firstName', { required: 'First name required' })}
                  className={`auth-input auth-input--small ${errors.firstName ? 'auth-input--error' : ''}`}
                />
                {errors.firstName && <p className="auth-error auth-error--inline">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="auth-field auth-field--compact">LAST NAME</label>
                <input
                  type="text"
                  placeholder="Last name"
                  {...register('lastName', { required: 'Last name required' })}
                  className={`auth-input auth-input--small ${errors.lastName ? 'auth-input--error' : ''}`}
                />
                {errors.lastName && <p className="auth-error auth-error--inline">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="auth-field auth-field--compact">EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email required',
                  pattern: { value: emailRegex, message: 'Invalid email format' },
                })}
                className={`auth-input auth-input--small ${errors.email ? 'auth-input--error' : ''}`}
              />
              {errors.email && <p className="auth-error auth-error--inline">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="auth-field auth-field--compact">PHONE NUMBER</label>
              <input
                type="tel"
                placeholder="Phone number"
                {...register('phone', { required: 'Phone required' })}
                className={`auth-input auth-input--small ${errors.phone ? 'auth-input--error' : ''}`}
              />
              {errors.phone && <p className="auth-error auth-error--inline">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="auth-field auth-field--compact">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  {...register('password', { required: 'Password required' })}
                  className={`auth-input auth-input--small auth-input--with-icon ${errors.password ? 'auth-input--error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-input-toggle"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {password && (
                <div className="auth-password-strength">
                  <p className="auth-password-strength-title">Password requirements:</p>
                  <div className="auth-password-strength-list">
                    <div className={`auth-strength-item ${passwordStrength.hasUpperCase ? 'auth-strength-pass' : 'auth-strength-fail'}`}>
                      {passwordStrength.hasUpperCase ? <Check size={14} /> : <X size={14} />}
                      <span>Uppercase (A-Z)</span>
                    </div>
                    <div className={`auth-strength-item ${passwordStrength.hasLowerCase ? 'auth-strength-pass' : 'auth-strength-fail'}`}>
                      {passwordStrength.hasLowerCase ? <Check size={14} /> : <X size={14} />}
                      <span>Lowercase (a-z)</span>
                    </div>
                    <div className={`auth-strength-item ${passwordStrength.hasNumber ? 'auth-strength-pass' : 'auth-strength-fail'}`}>
                      {passwordStrength.hasNumber ? <Check size={14} /> : <X size={14} />}
                      <span>Number (0-9)</span>
                    </div>
                    <div className={`auth-strength-item ${passwordStrength.hasMinLength ? 'auth-strength-pass' : 'auth-strength-fail'}`}>
                      {passwordStrength.hasMinLength ? <Check size={14} /> : <X size={14} />}
                      <span>Minimum 8 characters</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="auth-field auth-field--compact">CONFIRM PASSWORD</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  {...register('confirmPassword', { required: 'Confirm password required' })}
                  className={`auth-input auth-input--small auth-input--with-icon ${errors.confirmPassword || (confirmPassword && confirmPassword !== password)
                    ? 'auth-input--error'
                    : ''
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="auth-input-toggle"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="auth-error auth-error--inline">Passwords do not match</p>
              )}
            </div>

            {/* Terms */}
            <label className="auth-terms-label">
              <input
                type="checkbox"
                {...register('agreeToTerms', { required: 'You must agree to continue' })}
                className="auth-terms-checkbox"
              />
              <span className="auth-terms-text">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTCModal(true)}
                  className="auth-terms-link cursor-pointer bg-transparent p-0"
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <Link href="/privacy" className="auth-terms-link">Privacy Policy</Link>
              </span>
            </label>
            {errors.agreeToTerms && <p className="auth-error auth-error--inline">{errors.agreeToTerms.message}</p>}

            {/* Terms & Conditions modal */}
            <TermsConditionsModal
              isOpen={showTCModal}
              onClose={() => setShowTCModal(false)}
              onAgree={() => setValue('agreeToTerms', true)}
            />

            {/* Error */}
            {error && <div className="auth-error-banner auth-error-banner--small">{error}</div>}

            {/* Submit */}
            <button type="submit" disabled={isLoading} className="auth-submit-btn auth-submit-btn--small">
              {isLoading && <div className="auth-spinner--small" />}
              {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">OR</span>
              <div className="auth-divider-line" />
            </div>

            {/* Google */}
            <GoogleSignInButton onSuccess={handleGoogleSuccess} />

            {/* Login Link */}
            <p className="auth-switch-text">
              ALREADY HAVE AN ACCOUNT?{' '}
              <Link href="/login" className="auth-switch-link">SIGN IN</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

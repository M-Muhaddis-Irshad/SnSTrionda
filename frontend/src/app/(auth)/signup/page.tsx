'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { Eye, EyeOff, Check, X } from 'lucide-react';

const SIGNUP_BG = 'https://res.cloudinary.com/gbor3ceh/image/upload/v1788284311/trionda-wears/auth/auth-signup.jpg';
const LOGO_URL = 'https://res.cloudinary.com/gbor3ceh/image/upload/v1788285597/trionda-icon-mark.png';

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

export default function SignupPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasMinLength: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormInputs>({
    mode: 'onSubmit',
  });

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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Registration failed');
        setIsLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/shop');
      } else {
        setError('Account created but login failed. Please sign in manually.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('An error occurred during registration');
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left: Background Image */}
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
          <Image
            src={LOGO_URL}
            alt="Trionda Logo"
            width={40}
            height={40}
            className="rounded"
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
                  className={`auth-input auth-input--small auth-input--with-icon ${
                    errors.confirmPassword || (confirmPassword && confirmPassword !== password)
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
                <a href="/terms" className="auth-terms-link">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="auth-terms-link">Privacy Policy</a>
              </span>
            </label>
            {errors.agreeToTerms && <p className="auth-error auth-error--inline">{errors.agreeToTerms.message}</p>}

            {/* Error */}
            {error && (
              <div className="auth-error-banner auth-error-banner--small">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="auth-submit-btn auth-submit-btn--small"
            >
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
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/shop' })}
              className="auth-google-btn auth-google-btn--small"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              CONTINUE WITH GOOGLE
            </button>

            {/* Login Link */}
            <p className="auth-switch-text">
              ALREADY HAVE AN ACCOUNT?{' '}
              <a href="/login" className="auth-switch-link">
                SIGN IN
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

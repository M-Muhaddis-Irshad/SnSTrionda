'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { Eye, EyeOff, Check, X } from 'lucide-react';

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
  
  const [imageUrl, setImageUrl] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string>('');
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
    const fetchImage = async () => {
      try {
        const res = await fetch('/api/auth/images/signup');
        if (!res.ok) throw new Error('Failed to fetch image');
        const data = await res.json();
        setImageUrl(data.imageUrl);
      } catch (err) {
        console.error('Image fetch error:', err);
        setImageUrl('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80&fit=crop');
      } finally {
        setPageLoading(false);
      }
    };

    fetchImage();
  }, []);

  useEffect(() => {
    setPasswordStrength({
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasMinLength: password.length >= 8,
    });
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

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left: Background Image with Overlay */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        {imageUrl && (
          <>
            <Image
              src={imageUrl}
              alt="Signup Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </>
        )}
      </div>

      {/* Right: Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-6 md:px-12 py-12 overflow-y-auto animate-fadeIn">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8 text-center">
            <p className="text-xs tracking-widest text-gray-400 mb-3">JOIN THE ATELIER</p>
            <h1 className="text-5xl md:text-6xl font-serif text-white mb-4">CREATE ACCOUNT</h1>
            <p className="text-gray-400">Create your Trionda Wears account and discover the collection.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs tracking-widest text-gray-300 mb-2">FIRST NAME</label>
                <input
                  type="text"
                  placeholder="First name"
                  {...register('firstName', { required: 'First name required' })}
                  className={`w-full px-4 py-3 bg-transparent border ${
                    errors.firstName ? 'border-red-500' : 'border-gray-600'
                  } text-white placeholder-gray-500 focus:outline-none focus:border-white focus-visible:ring-1 focus-visible:ring-white/50 transition text-sm`}
                />
                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-xs tracking-widest text-gray-300 mb-2">LAST NAME</label>
                <input
                  type="text"
                  placeholder="Last name"
                  {...register('lastName', { required: 'Last name required' })}
                  className={`w-full px-4 py-3 bg-transparent border ${
                    errors.lastName ? 'border-red-500' : 'border-gray-600'
                  } text-white placeholder-gray-500 focus:outline-none focus:border-white focus-visible:ring-1 focus-visible:ring-white/50 transition text-sm`}
                />
                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs tracking-widest text-gray-300 mb-2">EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email required',
                  pattern: { value: emailRegex, message: 'Invalid email format' },
                })}
                className={`w-full px-4 py-3 bg-transparent border ${
                  errors.email ? 'border-red-500' : 'border-gray-600'
                } text-white placeholder-gray-500 focus:outline-none focus:border-white focus-visible:ring-1 focus-visible:ring-white/50 transition text-sm`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs tracking-widest text-gray-300 mb-2">PHONE NUMBER</label>
              <input
                type="tel"
                placeholder="Phone number"
                {...register('phone', { required: 'Phone required' })}
                className={`w-full px-4 py-3 bg-transparent border ${
                  errors.phone ? 'border-red-500' : 'border-gray-600'
                } text-white placeholder-gray-500 focus:outline-none focus:border-white focus-visible:ring-1 focus-visible:ring-white/50 transition text-sm`}
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs tracking-widest text-gray-300 mb-2">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  {...register('password', { required: 'Password required' })}
                  className={`w-full px-4 py-3 pr-10 bg-transparent border ${
                    errors.password ? 'border-red-500' : 'border-gray-600'
                  } text-white placeholder-gray-500 focus:outline-none focus:border-white focus-visible:ring-1 focus-visible:ring-white/50 transition text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {password && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-400">Password requirements:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      {passwordStrength.hasUpperCase ? (
                        <Check size={14} className="text-green-400" />
                      ) : (
                        <X size={14} className="text-gray-600" />
                      )}
                      <span className={passwordStrength.hasUpperCase ? 'text-green-400' : 'text-gray-500'}>
                        Uppercase (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordStrength.hasLowerCase ? (
                        <Check size={14} className="text-green-400" />
                      ) : (
                        <X size={14} className="text-gray-600" />
                      )}
                      <span className={passwordStrength.hasLowerCase ? 'text-green-400' : 'text-gray-500'}>
                        Lowercase (a-z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordStrength.hasNumber ? (
                        <Check size={14} className="text-green-400" />
                      ) : (
                        <X size={14} className="text-gray-600" />
                      )}
                      <span className={passwordStrength.hasNumber ? 'text-green-400' : 'text-gray-500'}>
                        Number (0-9)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordStrength.hasMinLength ? (
                        <Check size={14} className="text-green-400" />
                      ) : (
                        <X size={14} className="text-gray-600" />
                      )}
                      <span className={passwordStrength.hasMinLength ? 'text-green-400' : 'text-gray-500'}>
                        Minimum 8 characters
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs tracking-widest text-gray-300 mb-2">CONFIRM PASSWORD</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  {...register('confirmPassword', { required: 'Confirm password required' })}
                  className={`w-full px-4 py-3 pr-10 bg-transparent border ${
                    errors.confirmPassword || (confirmPassword && confirmPassword !== password)
                      ? 'border-red-500'
                      : 'border-gray-600'
                  } text-white placeholder-gray-500 focus:outline-none focus:border-white focus-visible:ring-1 focus-visible:ring-white/50 transition text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('agreeToTerms', { required: 'You must agree to continue' })}
                className="w-4 h-4 border border-gray-600 bg-transparent cursor-pointer mt-1"
              />
              <span className="text-xs text-gray-300">
                I agree to the{' '}
                <a href="/terms" className="underline hover:no-underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="underline hover:no-underline">
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.agreeToTerms && <p className="text-red-400 text-xs">{errors.agreeToTerms.message}</p>}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded text-xs">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-white text-black font-semibold tracking-widest hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-sm"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              )}
              {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-600"></div>
              <span className="text-xs text-gray-400 tracking-widest">OR</span>
              <div className="flex-1 h-px bg-gray-600"></div>
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/shop' })}
              className="w-full py-3 border border-gray-600 text-white font-semibold tracking-widest hover:bg-white/5 transition flex items-center justify-center gap-2 text-sm"
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
            <p className="text-center text-gray-400 text-xs mt-8">
              ALREADY HAVE AN ACCOUNT?{' '}
              <a href="/login" className="text-white underline hover:no-underline">
                SIGN IN
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

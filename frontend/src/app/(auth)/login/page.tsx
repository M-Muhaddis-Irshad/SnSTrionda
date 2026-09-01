'use client';

import { Suspense, useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

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
  
  const [imageUrl, setImageUrl] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    mode: 'onSubmit',
  });

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const res = await fetch('/api/auth/images/login');
        if (!res.ok) throw new Error('Failed to fetch image');
        const data = await res.json();
        setImageUrl(data.imageUrl);
      } catch (err) {
        console.error('Image fetch error:', err);
        setImageUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop');
      } finally {
        setPageLoading(false);
      }
    };

    fetchImage();
  }, []);

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
              alt="Login Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </>
        )}
      </div>

      {/* Right: Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-6 md:px-12 py-12 animate-fadeIn">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8 text-center">
            <p className="text-xs tracking-widest text-gray-400 mb-3">WELCOME BACK</p>
            <h1 className="text-5xl md:text-6xl font-serif text-white mb-4">SIGN IN</h1>
            <p className="text-gray-400">Sign in to your Trionda Wears account to continue.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-xs tracking-widest text-gray-300 mb-3">EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: emailRegex, message: 'Invalid email format' },
                })}
                className={`w-full px-4 py-3 bg-transparent border ${
                  errors.email ? 'border-red-500' : 'border-gray-600'
                } text-white placeholder-gray-500 focus:outline-none focus:border-white focus-visible:ring-1 focus-visible:ring-white/50 transition`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-2">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs tracking-widest text-gray-300 mb-3">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password', { required: 'Password is required' })}
                  className={`w-full px-4 py-3 pr-10 bg-transparent border ${
                    errors.password ? 'border-red-500' : 'border-gray-600'
                  } text-white placeholder-gray-500 focus:outline-none focus:border-white focus-visible:ring-1 focus-visible:ring-white/50 transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-2">{errors.password.message}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 border border-gray-600 bg-transparent cursor-pointer"
                />
                <span className="text-gray-300">Remember me</span>
              </label>
              <a href="/forgot-password" className="text-gray-300 hover:text-white underline">
                Forgot password?
              </a>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-white text-black font-semibold tracking-widest hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              )}
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
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
              onClick={() => signIn('google', { callbackUrl })}
              className="w-full py-3 border border-gray-600 text-white font-semibold tracking-widest hover:bg-white/5 transition flex items-center justify-center gap-2"
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
            <p className="text-center text-gray-400 text-sm mt-8">
              NEW TO TRIONDA WEARS?{' '}
              <a href="/signup" className="text-white underline hover:no-underline">
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
        <div className="flex items-center justify-center min-h-screen bg-black">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

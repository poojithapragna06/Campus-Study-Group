import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { loginSchema, LoginFormValues } from '../schemas/auth';
import { useAuth } from '../context/AuthContext';
const login_url="http://localhost:5000/api/auth/login";
interface LoginPageProps {
  onNavigateToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToSignup }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError('');
    try {
      // ── Replace this block with your real API call ──────────────────────
      const res = await fetch(login_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
        credentials: "include",
      });

       const user = await res.json();
      if (!res.ok) {
        // const data = await res.json().catch(() => ({}));
        throw new Error(user?.message || 'Invalid email or password.');
      }
        localStorage.setItem("token", user.jwt);

     
      // ────────────────────────────────────────────────────────────────────

      login(user);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#0A0F1A', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Left panel: decorative ───────────────────────────────────────── */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0F1623 0%, #1A1F2E 100%)' }}
      >
        {/* Glow blobs */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,184,0,0.12) 0%, transparent 70%)',
            transform: 'translate(40%, -40%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(0,212,170,0.10) 0%, transparent 70%)',
            transform: 'translate(-40%, 40%)',
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,184,0,0.04) 59px,rgba(255,184,0,0.04) 60px),' +
              'repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,184,0,0.04) 59px,rgba(255,184,0,0.04) 60px)',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FFB800, #FF6B00)' }}
          >
            <BookOpen size={20} className="text-black" />
          </div>
          <span
            className="text-white font-bold text-xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            StudySync
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-6"
            style={{
              background: 'rgba(255,184,0,0.1)',
              color: '#FFB800',
              border: '1px solid rgba(255,184,0,0.2)',
            }}
          >
            Campus Collaboration Platform
          </span>
          <h2
            className="text-5xl font-bold text-white mb-5 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Learn better,
            <br />
            <span style={{ color: '#FFB800' }}>together.</span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: '#4A5A70', maxWidth: 380 }}>
            Connect with study groups, schedule sessions, and share notes — all in one place.
          </p>

          {/* Stats */}
          <div className="flex gap-8 mt-10">
            {[
              { value: '2,400+', label: 'Students' },
              { value: '180+', label: 'Study Groups' },
              { value: '4.9 ★', label: 'Rated' },
            ].map(s => (
              <div key={s.label}>
                <div
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {s.value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#4A5A70' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div
          className="relative p-5 rounded-2xl"
          style={{
            background: 'rgba(255,184,0,0.05)',
            border: '1px solid rgba(255,184,0,0.12)',
          }}
        >
          <p className="text-sm leading-relaxed" style={{ color: '#8899AA' }}>
            "StudySync completely changed how our CS batch prepares for exams. The group chat and
            shared files alone saved us hours every week."
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-black"
              style={{ background: '#FFB800' }}
            >
              RK
            </div>
            <div>
              <div className="text-xs font-medium text-white">Rohan Kumar</div>
              <div className="text-xs" style={{ color: '#4A5A70' }}>
                CS · Year 3
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FFB800, #FF6B00)' }}
            >
              <BookOpen size={18} className="text-black" />
            </div>
            <span
              className="text-white font-bold text-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              StudySync
            </span>
          </div>

          <div className="mb-8">
            <h1
              className="text-3xl font-bold text-white mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: '#4A5A70' }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Server error banner */}
          {serverError && (
            <div
              role="alert"
              className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#FCA5A5',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: '#F87171' }}
              />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium mb-2"
                style={{ color: '#8899AA', letterSpacing: '0.06em' }}
              >
                EMAIL ADDRESS
              </label>
              <input
                id="login-email"
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: '#111827',
                  border: `1px solid ${errors.email ? 'rgba(239,68,68,0.5)' : '#1E2A3A'}`,
                  color: '#E8EDF4',
                  boxShadow: errors.email ? '0 0 0 3px rgba(239,68,68,0.07)' : 'none',
                }}
              />
              {errors.email && (
                <p
                  role="alert"
                  className="mt-1.5 text-xs flex items-center gap-1"
                  style={{ color: '#F87171' }}
                >
                  <span aria-hidden="true">⚠</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="login-password"
                  className="text-xs font-medium"
                  style={{ color: '#8899AA', letterSpacing: '0.06em' }}
                >
                  PASSWORD
                </label>
                <button
                  type="button"
                  className="text-xs transition-opacity hover:opacity-75"
                  style={{ color: '#FFB800' }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: '#111827',
                    border: `1px solid ${errors.password ? 'rgba(239,68,68,0.5)' : '#1E2A3A'}`,
                    color: '#E8EDF4',
                    boxShadow: errors.password ? '0 0 0 3px rgba(239,68,68,0.07)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-opacity hover:opacity-70"
                  style={{ color: '#4A5A70' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p
                  role="alert"
                  className="mt-1.5 text-xs flex items-center gap-1"
                  style={{ color: '#F87171' }}
                >
                  <span aria-hidden="true">⚠</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: isSubmitting ? 'rgba(255,184,0,0.55)' : '#FFB800',
                color: '#0A0F1A',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                marginTop: '4px',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px" style={{ background: '#1E2A3A' }} />
            <span className="text-xs" style={{ color: '#2A3A50' }}>or</span>
            <div className="flex-1 h-px" style={{ background: '#1E2A3A' }} />
          </div>

          <p className="text-center text-sm" style={{ color: '#4A5A70' }}>
            Don&apos;t have an account?{' '}
            <button
              onClick={onNavigateToSignup}
              className="font-medium transition-opacity hover:opacity-75"
              style={{ color: '#FFB800' }}
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

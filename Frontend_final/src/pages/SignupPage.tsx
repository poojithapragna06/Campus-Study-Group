import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, BookOpen, ArrowRight, Loader2, Check, X } from 'lucide-react';
import { signupSchema, SignupFormValues } from '../schemas/auth';
import { useAuth } from '../context/AuthContext';

interface SignupPageProps {
  onNavigateToLogin: () => void;
}

const passwordRules = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'One uppercase letter',  test: (v: string) => /[A-Z]/.test(v) },
  { label: 'One number',            test: (v: string) => /[0-9]/.test(v) },
];

const SignupPage: React.FC<SignupPageProps> = ({ onNavigateToLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [serverError, setServerError]   = useState('');
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
  });
const register_url="http://localhost:5000/api/auth/register";
  const passwordValue = watch('password', '');

  const onSubmit = async (values: SignupFormValues) => {
    setServerError('');
    try {
      // ── Replace this block with your real API call ──────────────────────
      const res = await fetch(register_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          password: values.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // If backend returns a field name, pin the error to that field
        if (data?.field && data?.message) {
          setError(data.field as keyof SignupFormValues, {
            type: 'server',
            message: data.message,
          });
          return;
        }
        throw new Error(data?.message || 'Could not create account. Please try again.');
      }

      const user = await res.json();
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
      {/* ── Left panel: form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
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
              Create account
            </h1>
            <p className="text-sm" style={{ color: '#4A5A70' }}>
              Join thousands of students already collaborating
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

            {/* Username */}
            <div>
              <label
                htmlFor="signup-username"
                className="block text-xs font-medium mb-2"
                style={{ color: '#8899AA', letterSpacing: '0.06em' }}
              >
                USERNAME
              </label>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm select-none pointer-events-none"
                  style={{ color: '#2A3A50' }}
                >
                  @
                </span>
                <input
                  id="signup-username"
                  {...register('username')}
                  type="text"
                  autoComplete="username"
                  placeholder="your_username"
                  className="w-full pl-8 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: '#111827',
                    border: `1px solid ${errors.username ? 'rgba(239,68,68,0.5)' : '#1E2A3A'}`,
                    color: '#E8EDF4',
                    boxShadow: errors.username ? '0 0 0 3px rgba(239,68,68,0.07)' : 'none',
                  }}
                />
              </div>
              {errors.username ? (
                <p
                  role="alert"
                  className="mt-1.5 text-xs flex items-center gap-1"
                  style={{ color: '#F87171' }}
                >
                  <span aria-hidden="true">⚠</span> {errors.username.message}
                </p>
              ) : (
                <p className="mt-1.5 text-xs" style={{ color: '#2A3A50' }}>
                  3–20 chars · letters, numbers, underscores only
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-medium mb-2"
                style={{ color: '#8899AA', letterSpacing: '0.06em' }}
              >
                EMAIL ADDRESS
              </label>
              <input
                id="signup-email"
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
              <label
                htmlFor="signup-password"
                className="block text-xs font-medium mb-2"
                style={{ color: '#8899AA', letterSpacing: '0.06em' }}
              >
                PASSWORD
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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

              {/* Live password strength checklist */}
              {passwordValue.length > 0 && (
                <ul className="mt-2.5 space-y-1.5" aria-label="Password requirements">
                  {passwordRules.map(rule => {
                    const passed = rule.test(passwordValue);
                    return (
                      <li
                        key={rule.label}
                        className="flex items-center gap-2 text-xs transition-colors duration-200"
                        style={{ color: passed ? '#00D4AA' : '#4A5A70' }}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: passed
                              ? 'rgba(0,212,170,0.12)'
                              : 'rgba(74,90,112,0.15)',
                          }}
                        >
                          {passed ? <Check size={9} /> : <X size={9} />}
                        </span>
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Show Zod error only when field is empty (rules cover the rest) */}
              {errors.password && !passwordValue && (
                <p
                  role="alert"
                  className="mt-1.5 text-xs flex items-center gap-1"
                  style={{ color: '#F87171' }}
                >
                  <span aria-hidden="true">⚠</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="signup-confirm"
                className="block text-xs font-medium mb-2"
                style={{ color: '#8899AA', letterSpacing: '0.06em' }}
              >
                CONFIRM PASSWORD
              </label>
              <div className="relative">
                <input
                  id="signup-confirm"
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: '#111827',
                    border: `1px solid ${errors.confirmPassword ? 'rgba(239,68,68,0.5)' : '#1E2A3A'}`,
                    color: '#E8EDF4',
                    boxShadow: errors.confirmPassword ? '0 0 0 3px rgba(239,68,68,0.07)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-opacity hover:opacity-70"
                  style={{ color: '#4A5A70' }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  role="alert"
                  className="mt-1.5 text-xs flex items-center gap-1"
                  style={{ color: '#F87171' }}
                >
                  <span aria-hidden="true">⚠</span> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms note */}
            <p className="text-xs leading-relaxed" style={{ color: '#2A3A50' }}>
              By creating an account you agree to our{' '}
              <button
                type="button"
                className="transition-opacity hover:opacity-80"
                style={{ color: '#4A5A70' }}
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                className="transition-opacity hover:opacity-80"
                style={{ color: '#4A5A70' }}
              >
                Privacy Policy
              </button>
              .
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: isSubmitting ? 'rgba(0,212,170,0.55)' : '#00D4AA',
                color: '#0A0F1A',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-7" style={{ color: '#4A5A70' }}>
            Already have an account?{' '}
            <button
              onClick={onNavigateToLogin}
              className="font-medium transition-opacity hover:opacity-75"
              style={{ color: '#FFB800' }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

      {/* ── Right panel: decorative ──────────────────────────────────────── */}
      <div
        className="hidden lg:flex w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0F1623 0%, #111827 100%)' }}
      >
        {/* Glow blobs */}
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(0,212,170,0.12) 0%, transparent 70%)',
            transform: 'translate(-40%, -40%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,184,0,0.10) 0%, transparent 70%)',
            transform: 'translate(40%, 40%)',
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(0,212,170,0.04) 59px,rgba(0,212,170,0.04) 60px),' +
              'repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(0,212,170,0.04) 59px,rgba(0,212,170,0.04) 60px)',
          }}
        />

        <div className="relative">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(0,212,170,0.1)',
              color: '#00D4AA',
              border: '1px solid rgba(0,212,170,0.2)',
            }}
          >
            Free to join
          </span>
        </div>

        {/* Feature list */}
        <div className="relative">
          <h2
            className="text-4xl font-bold text-white mb-8 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Everything you need to
            <br />
            <span style={{ color: '#00D4AA' }}>ace your semester.</span>
          </h2>

          <div className="space-y-3">
            {[
              { emoji: '👥', title: 'Study Groups',    desc: 'Create or join subject-specific groups' },
              { emoji: '💬', title: 'Group Chat',      desc: 'Real-time messaging and file sharing' },
              { emoji: '📅', title: 'Session Planner', desc: 'Schedule and RSVP to study sessions' },
              { emoji: '📁', title: 'Shared Files',    desc: 'Notes, slides, and resources in one place' },
            ].map(f => (
              <div
                key={f.title}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'rgba(0,212,170,0.08)' }}
                >
                  {f.emoji}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{f.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#4A5A70' }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs" style={{ color: '#2A3A50' }}>
          Trusted by students across 12 universities
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

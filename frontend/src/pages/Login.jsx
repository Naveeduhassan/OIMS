import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../utils/validation';
import { ShoppingBag, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login, user } = useAuth();
  const navigate        = useNavigate();
  const location        = useLocation();

  // Where to send user after login
  let from = location.state?.from || '/dashboard';
  const message = location.state?.message || '';

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // If going to dashboard but cart has items, redirect to checkout instead
  if (from === '/dashboard') {
    try {
      const saved = localStorage.getItem('store_cart');
      const cartItems = saved ? JSON.parse(saved) : [];
      if (cartItems.length > 0) {
        from = '/checkout';
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      await login({ email: data.email, password: data.password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 size-[500px] rounded-full bg-[#0f766e]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-[500px] rounded-full bg-teal-400/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border border-white/80 bg-white/90 shadow-2xl shadow-slate-200/60 backdrop-blur-sm px-8 py-10">

          {/* Logo */}
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 group mb-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f766e] to-[#0d9488] text-white shadow-lg shadow-[#0f766e]/25 transition-transform group-hover:scale-105">
                <ShoppingBag size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-slate-800">Your<span className="text-[#0f766e]">Store</span></span>
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to your account to continue
            </p>
          </div>

          {/* Context message (e.g. redirected from checkout) */}
          {message && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-700 font-medium">{message}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-500" />
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...formRegister('email')}
                  placeholder="you@example.com"
                  className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                    errors.email
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-[#0f766e] focus:ring-[#0f766e]/10'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...formRegister('password')}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                    errors.password
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-[#0f766e] focus:ring-[#0f766e]/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#0d9488] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0f766e]/25 transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          {/* Register CTA */}
          <p className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              state={location.state}
              className="font-bold text-[#0f766e] hover:text-[#115e59] transition-colors"
            >
              Create one free →
            </Link>
          </p>

          {/* Back to store */}
          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← Back to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
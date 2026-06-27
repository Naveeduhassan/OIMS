import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../utils/validation';
import {
  ShoppingBag, User, Mail, Lock, Phone, MapPin, Eye, EyeOff,
  ArrowRight, AlertCircle, CheckCircle2,
} from 'lucide-react';

function strengthLabel(pwd) {
  if (!pwd) return null;
  if (pwd.length < 6) return { label: 'Too short', color: 'bg-rose-400', width: 'w-1/4' };
  if (pwd.length < 8) return { label: 'Too short (min 8)', color: 'bg-orange-400', width: 'w-1/3' };
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { label: 'Strong ✓', color: 'bg-emerald-500', width: 'w-full' };
  if (/[0-9]/.test(pwd)) return { label: 'Good (add uppercase)', color: 'bg-teal-400', width: 'w-3/4' };
  return { label: 'Add numbers', color: 'bg-amber-400', width: 'w-2/4' };
}

export default function Register() {
  const [showPwd, setShowPwd]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [error, setError]                     = useState('');
  const [loading, setLoading]                 = useState(false);

  const { register: authRegister, user } = useAuth();
  const navigate                         = useNavigate();
  const location                         = useLocation();
  let from                               = location.state?.from || '/dashboard';

  const {
    register: formRegister,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const strength = strengthLabel(password);

  // If going to dashboard but cart has items, redirect to checkout instead
  if (from === '/dashboard') {
    try {
      const saved = localStorage.getItem('store_cart');
      const cartItems = saved ? JSON.parse(saved) : [];
      if (cartItems.length > 0) from = '/checkout';
    } catch (e) {}
  }

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      await authRegister({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        address: data.address,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 size-[500px] rounded-full bg-[#0f766e]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-[500px] rounded-full bg-teal-400/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/80 bg-white/90 shadow-2xl shadow-slate-200/60 backdrop-blur-sm px-8 py-10">

          {/* Logo */}
          <div className="mb-7 text-center">
            <Link to="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f766e] to-[#0d9488] text-white shadow-lg shadow-[#0f766e]/25 transition-transform group-hover:scale-105">
                <ShoppingBag size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-slate-800">Your<span className="text-[#0f766e]">Store</span></span>
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500">Free forever — takes less than a minute</p>
          </div>

          {/* Context / error messages */}
          {location.state?.message && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-700 font-medium">{location.state.message}</p>
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-500" />
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Full Name */}
            <Field label="Full Name" id="full_name" error={errors.full_name?.message}>
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="full_name" type="text" autoComplete="name"
                {...formRegister('full_name')}
                placeholder="Ali Khan"
                className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                  errors.full_name
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-[#0f766e] focus:ring-[#0f766e]/10'
                }`} />
            </Field>

            {/* Email */}
            <Field label="Email Address" id="email" error={errors.email?.message}>
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="email" type="email" autoComplete="email"
                {...formRegister('email')}
                placeholder="ali@gmail.com"
                className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                  errors.email
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-[#0f766e] focus:ring-[#0f766e]/10'
                }`} />
            </Field>

            {/* Phone */}
            <Field label="Phone Number" id="phone" optional error={errors.phone?.message}>
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="phone" type="tel" autoComplete="tel"
                {...formRegister('phone')}
                placeholder="03XXXXXXXXX"
                className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                  errors.phone
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-[#0f766e] focus:ring-[#0f766e]/10'
                }`} />
            </Field>

            {/* Address */}
            <Field label="City / Address" id="address" optional error={errors.address?.message}>
              <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input id="address" type="text" autoComplete="street-address"
                {...formRegister('address')}
                placeholder="Lahore, Pakistan"
                className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                  errors.address
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-[#0f766e] focus:ring-[#0f766e]/10'
                }`} />
            </Field>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="password" type={showPwd ? 'text' : 'password'} autoComplete="new-password"
                  {...formRegister('password')}
                  placeholder="Min. 8 chars, include a number"
                  className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                    errors.password
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-[#0f766e] focus:ring-[#0f766e]/10'
                  }`} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password.message}
                </p>
              )}
              {strength && (
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div className={`h-full rounded-full transition-all duration-500 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400 font-medium">{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="confirm-password" type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
                  {...formRegister('confirmPassword')}
                  placeholder="Re-enter password"
                  className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                    errors.confirmPassword
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : confirmPassword && password === confirmPassword
                      ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100'
                      : 'border-slate-200 focus:border-[#0f766e] focus:ring-[#0f766e]/10'
                  }`} />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {confirmPassword && password === confirmPassword && (
                  <CheckCircle2 size={16} className="absolute right-9 top-1/2 -translate-y-1/2 text-emerald-500" />
                )}
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-400 text-center">
              By registering you agree to our{' '}
              <span className="text-[#0f766e] font-semibold cursor-pointer hover:underline">Terms of Service</span>
              {' '}and{' '}
              <span className="text-[#0f766e] font-semibold cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#0d9488] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0f766e]/25 transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Creating account…
                </span>
              ) : <><ArrowRight size={16} /> Create Account</>}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" state={location.state} className="font-bold text-[#0f766e] hover:text-[#115e59] transition-colors">
              Sign in →
            </Link>
          </p>
          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">← Back to Store</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, id, optional, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {optional && <span className="text-slate-400 font-normal">(optional)</span>}
      </label>
      <div className="relative">{children}</div>
      {error && (
        <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
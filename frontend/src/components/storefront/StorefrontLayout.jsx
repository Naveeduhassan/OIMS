import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import CartDrawer from './CartDrawer';
import {
  ShoppingBag, Search, User as UserIcon, Menu, X,
  ChevronDown, LogOut, LayoutDashboard, Package,
  Tag, Home, Phone, Mail, MapPin, Instagram, Twitter, Facebook, Heart,
} from 'lucide-react';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative text-sm font-semibold transition-colors ${
          isActive ? 'text-[#0f766e]' : 'text-slate-600 hover:text-[#0f766e]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {children}
          <span
            className={`absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-[#0f766e] transition-transform origin-left ${
              isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
            }`}
          />
        </>
      )}
    </NavLink>
  );
}

/* ── User Dropdown ────────────────────────────────────────────────────────── */
function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const portalPath = user.role === 'admin' || user.role === 'staff' ? '/admin' : '/portal';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm hover:border-[#0f766e] hover:bg-[#f5fbfa] transition-all"
      >
        <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#0d9488] text-white text-xs font-bold">
          {user.full_name?.charAt(0)?.toUpperCase() || <UserIcon size={12} />}
        </div>
        <span className="hidden sm:block max-w-[100px] truncate">
          {user.full_name?.split(' ')[0]}
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60 py-1.5 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-800 truncate">{user.full_name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => { setOpen(false); navigate(portalPath); }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <LayoutDashboard size={15} className="text-[#0f766e]" />
            Dashboard
          </button>
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Mobile Menu ──────────────────────────────────────────────────────────── */
function MobileMenu({ open, onClose, user, onLogout }) {
  const navigate = useNavigate();
  const portalPath = user?.role === 'admin' || user?.role === 'staff' ? '/admin' : '/portal';

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="relative ml-auto flex h-full w-72 flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <Link to="/" onClick={onClose} className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f766e] to-[#0d9488] text-white">
              <ShoppingBag size={16} />
            </div>
            <span className="text-lg font-bold">Your<span className="text-[#0f766e]">Store</span></span>
          </Link>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={22} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {[
            { to: '/', label: 'Home', icon: Home },
            { to: '/products', label: 'Shop', icon: Package },
            { to: '/categories', label: 'Categories', icon: Tag },
          ].map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-[#0f766e]/10 text-[#0f766e]' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-100 p-4">
          {user ? (
            <div className="space-y-2">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-bold text-slate-800">{user.full_name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <button
                onClick={() => { onClose(); navigate(portalPath); }}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <LayoutDashboard size={15} className="text-[#0f766e]" /> Dashboard
              </button>
              <button
                onClick={() => { onClose(); onLogout(); }}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-50"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Modern Footer ────────────────────────────────────────────────────────── */
function StorefrontFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Top wave */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0f766e] via-teal-400 to-cyan-500" />

      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 group mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f766e] to-[#0d9488] text-white shadow-lg shadow-[#0f766e]/30">
                <ShoppingBag size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-white">
                Your<span className="text-teal-400">Store</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Your one-stop destination for quality products at unbeatable prices. Shop smart, live better.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Instagram, label: 'Instagram' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full border border-slate-700 text-slate-400 hover:border-teal-500 hover:text-teal-400 transition-colors"
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-5">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { label: 'Home', to: '/' },
                { label: 'Shop All Products', to: '/products' },
                { label: 'Browse Categories', to: '/categories' },
                { label: 'My Orders', to: '/portal/orders' },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-5">Account</h3>
            <ul className="space-y-3">
              {[
                { label: 'Login', to: '/login' },
                { label: 'Register', to: '/register' },
                { label: 'My Dashboard', to: '/portal' },
                { label: 'Checkout', to: '/checkout' },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-5">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <MapPin size={16} className="mt-0.5 shrink-0 text-teal-500" />
                123 Commerce Street, Lahore, Pakistan
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <Phone size={16} className="shrink-0 text-teal-500" />
                +92 300 1234567
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <Mail size={16} className="shrink-0 text-teal-500" />
                support@yourstore.pk
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-slate-800" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} YourStore Inc. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-xs text-slate-500">
            Made with <Heart size={12} className="text-rose-400 fill-rose-400" /> in Pakistan
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <button className="hover:text-teal-400 transition-colors">Privacy Policy</button>
            <button className="hover:text-teal-400 transition-colors">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Main Layout ──────────────────────────────────────────────────────────── */
export default function StorefrontLayout() {
  const { user, logout } = useAuth();
  const { cartCount, setCartOpen } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout?.();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 font-sans selection:bg-[#0f766e]/20 selection:text-[#0f766e]">
      {/* ── Glassmorphic Navbar ── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f766e] to-[#0d9488] text-white shadow-md shadow-[#0f766e]/20 transition-transform group-hover:scale-105">
              <ShoppingBag size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              Your<span className="text-[#0f766e]">Store</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/products">Shop</NavItem>
            <NavItem to="/categories">Categories</NavItem>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search (placeholder) */}
            <button
              aria-label="Search"
              className="hidden sm:flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-[#0f766e] transition-colors"
            >
              <Search size={18} />
            </button>

            {/* Cart */}
            <button
              aria-label="Open cart"
              className="relative flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-[#0f766e] transition-colors"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth */}
            {user ? (
              <UserDropdown user={user} onLogout={handleLogout} />
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-sm font-bold text-slate-600 hover:text-[#0f766e] hover:bg-slate-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-gradient-to-r from-[#0f766e] to-[#0d9488] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#0f766e]/20 hover:opacity-90 transition-opacity"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="md:hidden flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="min-h-[70vh]">
        <Outlet />
      </main>

      {/* Modern Footer */}
      <StorefrontFooter />

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}

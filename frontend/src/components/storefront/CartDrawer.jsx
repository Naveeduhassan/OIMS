import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { X, Plus, Minus, ShoppingBag, ArrowRight, LogIn, UserPlus, Lock } from 'lucide-react';
import { fmtPKR } from '../../utils/currency';

/* ── Login-required prompt shown inside drawer ─────────────────────────── */
function LoginPrompt({ onClose }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-amber-200 bg-amber-50 mx-4 my-6 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-amber-100">
        <Lock size={26} className="text-amber-600" />
      </div>
      <div>
        <p className="text-base font-bold text-slate-800">Sign in to Checkout</p>
        <p className="mt-1 text-sm text-slate-500">
          You need an account to place an order. It only takes a minute!
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Link
          to="/register"
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#0d9488] py-3 text-sm font-bold text-white shadow-md shadow-[#0f766e]/20 hover:opacity-90 transition-opacity"
        >
          <UserPlus size={16} />
          Create Free Account
        </Link>
        <Link
          to="/login"
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <LogIn size={16} />
          Login to Existing Account
        </Link>
      </div>
    </div>
  );
}

/* ── Main Cart Drawer ───────────────────────────────────────────────────── */
export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  if (!cartOpen) return null;

  const handleCheckout = () => {
    if (!user) {
      setShowLoginPrompt(true);
    } else {
      setCartOpen(false);
      navigate('/checkout');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => { setCartOpen(false); setShowLoginPrompt(false); }}
      />

      {/* Drawer panel */}
      <aside className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-[#0f766e]" size={20} />
            <h2 className="text-lg font-bold">Your Cart</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            onClick={() => { setCartOpen(false); setShowLoginPrompt(false); }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          {/* Login prompt banner */}
          {showLoginPrompt && <LoginPrompt onClose={() => setCartOpen(false)} />}

          <div className="p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center opacity-70">
                <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
                  <ShoppingBag size={40} strokeWidth={1.5} />
                </div>
                <p className="font-bold text-slate-700">Your cart is empty</p>
                <p className="mt-1 text-sm text-slate-500">Looks like you haven't added anything yet.</p>
                <button
                  className="mt-6 rounded-lg bg-[#0f766e] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0f766e]/20 hover:bg-[#115e59] transition-colors"
                  onClick={() => { setCartOpen(false); navigate('/products'); }}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map(({ product, qty }) => (
                <div
                  key={product.id}
                  className="flex gap-4 rounded-xl border border-slate-200/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Product image placeholder */}
                  <div className="size-16 shrink-0 rounded-lg bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-300">
                    <ShoppingBag size={24} />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-800 line-clamp-2 pr-2">{product.name}</p>
                      <button
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                        onClick={() => removeFromCart(product.id)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-bold text-[#0f766e]">{fmtPKR(product.price)}</p>
                      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                        <button
                          className="text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
                          disabled={qty <= 1}
                          onClick={() => updateQuantity(product.id, -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-4 text-center text-xs font-bold">{qty}</span>
                        <button
                          className="text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
                          disabled={qty >= product.stock}
                          onClick={() => updateQuantity(product.id, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer / Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-slate-100 bg-white p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal ({cartCount} items)</span>
                <span className="font-semibold text-slate-700">{fmtPKR(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Shipping</span>
                <span className="font-semibold text-slate-700">Calculated at checkout</span>
              </div>
              <div className="my-2 border-t border-slate-100" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Total</span>
                <span className="text-xl font-bold text-[#0f766e]">{fmtPKR(cartTotal)}</span>
              </div>
            </div>

            {/* Show who is logged in or prompt */}
            {user ? (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#0f766e]/5 border border-[#0f766e]/10 px-3 py-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-[#0f766e] text-white text-xs font-bold">
                  {user.full_name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-xs text-slate-600 font-medium">
                  Ordering as <strong>{user.full_name?.split(' ')[0]}</strong>
                </span>
              </div>
            ) : (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                <Lock size={14} className="text-amber-500 shrink-0" />
                <span className="text-xs text-amber-700 font-medium">
                  Login required to place an order
                </span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0"
            >
              {user ? (
                <>Proceed to Checkout <ArrowRight size={16} /></>
              ) : (
                <>Sign In to Checkout <LogIn size={16} /></>
              )}
            </button>
            <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              🔒 Secure Encrypted Checkout
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

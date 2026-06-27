import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { orderAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { fmtPKR } from '../../utils/currency';
import {
  ShoppingBag, Lock, UserPlus, User, Phone, MapPin,
  Building, Hash, CreditCard, Truck, Smartphone, Landmark,
  ChevronRight, CheckCircle, ShieldCheck,
} from 'lucide-react';

/* ── Payment method options ───────────────────────────────────────────── */
const PAYMENT_METHODS = [
  { id: 'cash',      label: 'Cash on Delivery', icon: Truck,       desc: 'Pay when you receive' },
  { id: 'jazzcash',  label: 'JazzCash',          icon: Smartphone,  desc: 'Mobile wallet payment' },
  { id: 'easypaisa', label: 'EasyPaisa',         icon: Smartphone,  desc: 'Mobile wallet payment' },
  { id: 'bank',      label: 'Bank Transfer',      icon: Landmark,    desc: 'Direct bank transfer' },
];

const SHIPPING_FEE = 200;

/* ── Not-logged-in gate ───────────────────────────────────────────────── */
function AuthGate() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-sm w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100">
          <Lock size={28} className="text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Sign in Required</h2>
        <p className="text-sm text-slate-500 mb-6">
          You need an account to place an order. Create one free — it only takes a minute!
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/register" state={{ from: '/checkout', message: 'Please create an account to place your order.' }}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#0d9488] py-3 text-sm font-bold text-white shadow-md hover:opacity-90 transition-opacity">
            <UserPlus size={16} /> Create Free Account
          </Link>
          <Link to="/login" state={{ from: '/checkout', message: 'Please sign in to place your order.' }}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Order Success screen ─────────────────────────────────────────────── */
function OrderSuccess({ orderId, total, onContinue }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-100">
          <CheckCircle size={48} className="text-emerald-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Order Placed! 🎉</h1>
        <p className="text-slate-500 mb-6">
          Thank you for your order. We'll process it right away.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-md p-6 mb-6 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Order ID</span>
            <span className="font-bold text-slate-800">#{orderId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total Paid</span>
            <span className="font-bold text-[#0f766e]">{fmtPKR(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Status</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              Processing
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/portal/orders"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#0d9488] py-3.5 text-sm font-bold text-white shadow-md hover:opacity-90 transition-opacity">
            Track My Order <ChevronRight size={16} />
          </Link>
          <button onClick={onContinue}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            <ShoppingBag size={16} /> Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Checkout Page ───────────────────────────────────────────────── */
export default function CheckoutPage() {
  const { cart, cartTotal, clearCart, setCartOpen } = useCart();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(null); // { orderId, total }

  // Form fields
  const [fullName, setFullName]     = useState(user?.full_name || '');
  const [phone, setPhone]           = useState('');
  const [address, setAddress]       = useState('');
  const [city, setCity]             = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [payMethod, setPayMethod]   = useState('cash');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
    }
  }, [user]);


  if (!user) return <AuthGate />;

  if (success) {
    return (
      <OrderSuccess
        orderId={success.orderId}
        total={success.total}
        onContinue={() => { clearCart(); navigate('/'); }}
      />
    );
  }

  const totalWithShipping = cartTotal + SHIPPING_FEE;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) return setError('Delivery address is required.');
    if (!phone.trim())   return setError('Phone number is required.');
    if (!city.trim())    return setError('City is required.');

    setLoading(true);
    setError('');

    const orderData = {
      items: cart.map((item) => ({ product_id: item.product.id, quantity: item.qty })),
      payment_method: payMethod,
      shipping_address: `${address}, ${city}${postalCode ? ', ' + postalCode : ''}`,
      phone,
      customer_name: fullName,
      customer_email: user.email,
    };

    try {
      const resp = await orderAPI.create(orderData);
      // Backend returns: { message: "...", data: orderObj } at HTTP 201
      if (resp?.status === 201 || resp?.data?.data) {
        const order = resp.data?.data || {};
        const orderId = order.id || order.order_id || '—';
        clearCart();
        setCartOpen(false);
        setSuccess({ orderId, total: totalWithShipping });
      } else {
        setError(resp?.data?.message || resp?.data?.error || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-center px-4">
        <div>
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-slate-100">
            <ShoppingBag size={36} className="text-slate-400" strokeWidth={1.5} />
          </div>
          <p className="text-xl font-bold text-slate-700">Your cart is empty</p>
          <p className="mt-1 text-sm text-slate-500">Add some products before checking out.</p>
          <button onClick={() => navigate('/products')}
            className="mt-6 rounded-xl bg-[#0f766e] px-6 py-3 text-sm font-bold text-white hover:bg-[#115e59] transition-colors">
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold text-slate-800 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">

          {/* ── Left: Delivery + Payment ── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Delivery Information */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <MapPin size={18} className="text-[#0f766e]" /> Delivery Information
                </h2>
              </div>
              <div className="p-6 space-y-4">

                {/* Full Name */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Full Name" icon={User}>
                    <input type="text" required value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ali Khan"
                      className="input-base" />
                  </FormField>
                  <FormField label="Phone Number" icon={Phone}>
                    <input type="tel" required value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="03001234567"
                      className="input-base" />
                  </FormField>
                </div>

                <FormField label="Street Address" icon={MapPin}>
                  <input type="text" required value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Model Town, Block A, House 5"
                    className="input-base" />
                </FormField>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="City" icon={Building}>
                    <input type="text" required value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Lahore"
                      className="input-base" />
                  </FormField>
                  <FormField label="Postal Code" icon={Hash} optional>
                    <input type="text" value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="54000"
                      className="input-base" />
                  </FormField>
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard size={18} className="text-[#0f766e]" /> Payment Method
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPayMethod(id)}
                    className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      payMethod === id
                        ? 'border-[#0f766e] bg-[#0f766e]/5 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      payMethod === id ? 'bg-[#0f766e] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${payMethod === id ? 'text-[#0f766e]' : 'text-slate-700'}`}>{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    {payMethod === id && (
                      <CheckCircle size={16} className="ml-auto mt-0.5 shrink-0 text-[#0f766e]" />
                    )}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h2 className="text-base font-bold text-slate-800">Order Summary</h2>
                <p className="text-xs text-slate-500 mt-0.5">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>
              </div>

              {/* Items */}
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {cart.map(({ product, qty }) => (
                  <div key={product.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <ShoppingBag size={16} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{product.name}</p>
                      <p className="text-xs text-slate-400">Qty: {qty}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-700 shrink-0">{fmtPKR(product.price * qty)}</p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-slate-100 px-6 py-4 space-y-2.5">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700">{fmtPKR(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Shipping</span>
                  <span className="font-semibold text-slate-700">{fmtPKR(SHIPPING_FEE)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Payment</span>
                  <span className="font-semibold text-slate-700 capitalize">
                    {PAYMENT_METHODS.find(m => m.id === payMethod)?.label}
                  </span>
                </div>
                <div className="my-1 border-t border-slate-200" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Total</span>
                  <span className="text-xl font-extrabold text-[#0f766e]">{fmtPKR(totalWithShipping)}</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mx-4 mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
                  {error}
                </div>
              )}

              {/* Logged-in as */}
              <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-[#0f766e]/5 border border-[#0f766e]/10 px-3 py-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-[#0f766e] text-white text-xs font-bold">
                  {user.full_name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-xs text-slate-600 font-medium">
                  Ordering as <strong>{user.full_name?.split(' ')[0]}</strong> · {user.email}
                </span>
              </div>

              {/* Submit */}
              <div className="px-6 pb-6">
                <button type="submit" disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#0d9488] py-4 text-sm font-bold text-white shadow-lg shadow-[#0f766e]/25 transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Placing Order…
                    </span>
                  ) : (
                    <><CheckCircle size={18} /> Place Order — {fmtPKR(totalWithShipping)}</>
                  )}
                </button>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck size={13} />
                  Secure & encrypted checkout
                </div>
              </div>
            </div>
          </div>

        </div>
      </form>

      {/* Inline styles for inputs */}
      <style>{`
        .input-base {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: rgba(248,250,252,0.5);
          padding: 0.75rem 0.75rem 0.75rem 2.5rem;
          font-size: 0.875rem;
          color: #1e293b;
          outline: none;
          transition: all 0.15s;
        }
        .input-base::placeholder { color: #94a3b8; }
        .input-base:focus {
          border-color: #0f766e;
          background: white;
          box-shadow: 0 0 0 3px rgba(15,118,110,0.1);
        }
      `}</style>
    </div>
  );
}

function FormField({ label, icon: Icon, optional, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {optional && <span className="text-slate-400 font-normal">(optional)</span>}
      </label>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
        {children}
      </div>
    </div>
  );
}

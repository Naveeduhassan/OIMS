import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, categoryAPI } from '../../api';
import { fmtPKR } from '../../utils/currency';
import { useCart } from '../../contexts/CartContext';
import {
  ShoppingBag, ArrowRight, Tag, Package, Truck, Shield,
  RefreshCw, Headphones, Star, ChevronRight, ShoppingCart, Zap,
} from 'lucide-react';

/* ── Feature badges ──────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Truck,      title: 'Fast Delivery',      desc: 'Delivered in 2-3 business days nationwide' },
  { icon: Shield,     title: 'Secure Payments',     desc: 'JazzCash, EasyPaisa, Bank & COD accepted' },
  { icon: RefreshCw,  title: 'Easy Returns',        desc: '7-day hassle-free return policy' },
  { icon: Headphones, title: '24/7 Support',        desc: 'Always here to help you' },
];

/* ── Quick-add Product Card ──────────────────────────────────────────── */
function HomeProductCard({ product, onAdd }) {
  const [added, setAdded] = useState(false);
  const inStock = product.stock > 0;

  const handleAdd = (e) => {
    e.preventDefault();
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Link
      to={`/products?q=${encodeURIComponent(product.name)}`}
      className="group flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="h-40 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <Package size={44} className="text-slate-200" strokeWidth={1} />
        )}
        {product.category_name && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 shadow-sm px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {product.category_name}
          </span>
        )}
        <span className={`absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
        }`}>
          {inStock ? `${product.stock} left` : 'Out of stock'}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-bold text-slate-800 group-hover:text-[#0f766e] transition-colors text-sm line-clamp-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 text-xs text-slate-400 line-clamp-2">{product.description}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <p className="text-base font-extrabold text-[#0f766e]">{fmtPKR(product.price)}</p>
          <button
            onClick={handleAdd}
            disabled={!inStock}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
              added
                ? 'bg-emerald-500 text-white'
                : inStock
                ? 'bg-slate-900 text-white hover:bg-[#0f766e]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {added ? '✓ Added' : <><ShoppingCart size={12} /> Add</>}
          </button>
        </div>
      </div>
    </Link>
  );
}

/* ── Category card ───────────────────────────────────────────────────── */
const CAT_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
  'from-blue-500 to-indigo-600',
  'from-green-500 to-emerald-600',
];

/* ── HomePage ────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories]             = useState([]);
  const [loading, setLoading]                   = useState(true);
  const { addToCart, setCartOpen }              = useCart();

  useEffect(() => {
    Promise.all([
      productAPI.getAll().then(r => {
        const list = r.data?.data || [];
        setFeaturedProducts(list.filter(p => p.stock > 0).slice(0, 8));
      }),
      categoryAPI.getAll().then(r => {
        const cats = r.data;
        setCategories((Array.isArray(cats) ? cats : (cats?.data || [])).slice(0, 6));
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const handleAdd = (product) => {
    addToCart(product, 1);
    setCartOpen(true);
  };

  return (
    <div className="bg-[#fcfcfc]">

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-[#0f766e]/80 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 size-[600px] -translate-y-1/2 rounded-full bg-[#0f766e]/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 size-[400px] translate-y-1/2 rounded-full bg-teal-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-1.5 text-sm font-semibold text-teal-300 backdrop-blur-sm">
              <Zap size={14} className="fill-teal-300" /> New Arrivals Available
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Shop Smart.<br />
              <span className="text-teal-400">Live Better.</span>
            </h1>

            <p className="mt-5 text-lg text-slate-300 leading-relaxed max-w-xl">
              Explore thousands of premium products with fast delivery, secure payments, and unbeatable prices — all in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-full bg-teal-400 px-7 py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-teal-400/30 hover:bg-teal-300 transition-all hover:-translate-y-0.5"
              >
                Shop Now <ArrowRight size={16} />
              </Link>
              <Link
                to="/categories"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
              >
                Browse Categories <ChevronRight size={16} />
              </Link>
            </div>

            {/* Trust stats */}
            <div className="mt-12 flex flex-wrap gap-6">
              {[
                { value: '10K+', label: 'Happy Customers' },
                { value: '500+', label: 'Products' },
                { value: '4.9★', label: 'Avg. Rating' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold text-teal-400">{value}</p>
                  <p className="text-sm text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0f766e]/10 text-[#0f766e]">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0f766e]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#0f766e] mb-2">
                <Tag size={12} /> Categories
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Shop by Category</h2>
            </div>
            <Link to="/categories" className="flex items-center gap-1 text-sm font-bold text-[#0f766e] hover:gap-2 transition-all">
              View all <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className={`group flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br ${CAT_GRADIENTS[i % CAT_GRADIENTS.length]} p-6 text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Tag size={20} />
                </div>
                <p className="text-center text-sm font-bold leading-tight">{cat.name || cat.category_name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── FEATURED PRODUCTS ───────────────────────────────────────── */}
      <section className="bg-slate-50/50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0f766e]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#0f766e] mb-2">
                <Star size={12} className="fill-[#0f766e]" /> Featured
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Featured Products</h2>
            </div>
            <Link to="/products" className="flex items-center gap-1 text-sm font-bold text-[#0f766e] hover:gap-2 transition-all">
              View all <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-56 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map(p => (
                <HomeProductCard key={p.id} product={p} onAdd={handleAdd} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Package size={40} className="mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
              <p className="text-slate-500 font-medium">No products available yet.</p>
              <p className="text-sm text-slate-400 mt-1">Check back soon!</p>
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0f766e] to-[#0d9488] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0f766e]/25 hover:opacity-90 hover:-translate-y-0.5 transition-all"
            >
              <ShoppingBag size={16} /> Shop All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl mb-2">How It Works</h2>
        <p className="text-slate-500 mb-12 text-sm">Order in 4 simple steps</p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { step: '01', title: 'Browse & Search', desc: 'Find products you love by name or category', icon: ShoppingBag },
            { step: '02', title: 'Add to Cart', desc: 'Select quantity and add items to your cart', icon: ShoppingCart },
            { step: '03', title: 'Checkout', desc: 'Fill your delivery details and pick payment', icon: Tag },
            { step: '04', title: 'Track Order', desc: 'We deliver and you track progress in real-time', icon: Truck },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="relative flex flex-col items-center">
              <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f766e] to-[#0d9488] text-white shadow-lg shadow-[#0f766e]/25">
                <Icon size={26} strokeWidth={1.5} />
                <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-teal-400">
                  {step}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">{title}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-[140px]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────── */}
      <section className="mx-4 mb-14 rounded-3xl bg-gradient-to-r from-slate-900 to-[#0f766e] p-10 text-center text-white shadow-2xl sm:mx-6 lg:mx-8">
        <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to start shopping?</h2>
        <p className="mt-2 text-slate-300 text-sm">Create your free account and place your first order in minutes.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-teal-400 px-7 py-3 text-sm font-bold text-slate-900 shadow-lg hover:bg-teal-300 transition-all"
          >
            Create Free Account <ArrowRight size={16} />
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-bold text-white hover:bg-white/20 transition-all"
          >
            Browse Products
          </Link>
        </div>
      </section>
    </div>
  );
}

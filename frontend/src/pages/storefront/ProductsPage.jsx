import React, { useState, useEffect, useMemo } from 'react';
import { productAPI, categoryAPI } from '../../api';
import { fmtPKR } from '../../utils/currency';
import { useCart } from '../../contexts/CartContext';
import { useSearchParams } from 'react-router-dom';
import {
  Search, ShoppingCart, X, Package, Tag, Layers,
  CheckCircle2, AlertCircle, Star, ChevronLeft, ChevronRight,
  Plus, Minus, ShoppingBag, Truck,
} from 'lucide-react';

/* ── Product Detail Modal (Step 5 of workflow) ──────────────────────── */
function ProductModal({ product, onClose, onAddToCart }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const inStock = product.stock > 0;

  const handleAdd = () => {
    // Allow adding to cart without login — cart is stored locally.
    // Login is only required at checkout.
    onAddToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Product image placeholder */}
        <div className="h-56 sm:h-72 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center rounded-t-3xl sm:rounded-t-3xl relative overflow-hidden">
          <div className="grid h-64 shrink-0 place-items-center bg-slate-50 sm:h-auto sm:w-full">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Package className="text-slate-200" size={80} />
            )}
          </div>
          {/* Category badge */}
          {product.category_name && (
            <span className="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
              {product.category_name}
            </span>
          )}
          {/* Stock badge */}
          <span className={`absolute top-4 right-12 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
            inStock
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700'
          }`}>
            {inStock ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>

        {/* Details */}
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">{product.name}</h2>
            {product.description && (
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{product.description}</p>
            )}
          </div>

          {/* Meta info grid */}
          <div className="grid grid-cols-2 gap-3">
            {product.category_name && (
              <InfoChip icon={Tag} label="Category" value={product.category_name} />
            )}
            {product.supplier_name && (
              <InfoChip icon={Layers} label="Supplier" value={product.supplier_name} />
            )}
            <InfoChip
              icon={Package}
              label="Stock"
              value={inStock ? `${product.stock} units available` : 'Out of stock'}
              valueClass={inStock ? 'text-emerald-600' : 'text-rose-600'}
            />
            <InfoChip icon={Truck} label="Delivery" value="2-3 business days" />
          </div>

          {/* Price + Qty + CTA */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Price</p>
                <p className="text-3xl font-extrabold text-[#0f766e]">{fmtPKR(product.price)}</p>
              </div>

              {/* Qty selector */}
              {inStock && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center text-base font-bold text-slate-800">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                    className="text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleAdd}
              disabled={!inStock}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all shadow-md ${
                added
                  ? 'bg-emerald-500 text-white shadow-emerald-200'
                  : inStock
                  ? 'bg-gradient-to-r from-[#0f766e] to-[#0d9488] text-white hover:opacity-90 hover:-translate-y-0.5 shadow-[#0f766e]/25'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {added ? (
                <><CheckCircle2 size={18} /> Added to Cart!</>
              ) : inStock ? (
                <><ShoppingCart size={18} /> Add to Cart — {fmtPKR(product.price * qty)}</>
              ) : (
                <>Out of Stock</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ icon: Icon, label, value, valueClass = 'text-slate-700' }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <Icon size={15} className="mt-0.5 shrink-0 text-[#0f766e]" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`text-sm font-semibold mt-0.5 ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

/* ── Product Card ────────────────────────────────────────────────────── */
function ProductCard({ product, onView, onAddToCart }) {
  const [added, setAdded] = useState(false);
  const inStock = product.stock > 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article
      onClick={() => onView(product)}
      className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Image area */}
      <div className="h-44 bg-slate-50 flex items-center justify-center relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <Package size={48} className="text-slate-200" strokeWidth={1} />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.category_name && (
            <span className="rounded-full bg-white/95 shadow-sm px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
              {product.category_name}
            </span>
          )}
        </div>
        <span className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm ${
          product.stock <= 0
            ? 'bg-rose-50 text-rose-600 border border-rose-100'
            : product.stock <= 10
            ? 'bg-amber-50 text-amber-700 border border-amber-100'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        }`}>
          {product.stock <= 0 ? 'Out of stock' : `${product.stock} left`}
        </span>

        {/* Quick-add overlay */}
        <div className="absolute inset-0 bg-[#0f766e]/0 group-hover:bg-[#0f766e]/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="text-xs font-bold text-[#0f766e] bg-white rounded-full px-3 py-1 shadow-md">
            Click to view details
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-bold text-slate-800 group-hover:text-[#0f766e] transition-colors line-clamp-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">{product.description}</p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between gap-2">
          <p className="text-lg font-extrabold text-[#0f766e]">{fmtPKR(product.price)}</p>
          <button
            onClick={handleAdd}
            disabled={!inStock}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              added
                ? 'bg-emerald-500 text-white'
                : inStock
                ? 'bg-slate-900 text-white hover:bg-[#0f766e]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {added ? <><CheckCircle2 size={13} /> Added</> : <><ShoppingCart size={13} /> Add</>}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ── Main Products Page ──────────────────────────────────────────────── */
export default function ProductsPage() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery]           = useState('');
  const [catFilter, setCatFilter]   = useState('all');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(null); // product detail modal
  const perPage = 12;

  const { addToCart, setCartOpen } = useCart();
  const [searchParams]              = useSearchParams();

  // Pre-fill search query and category from URL params (?q=...&category=...)
  useEffect(() => {
    const urlQ   = searchParams.get('q');
    const urlCat = searchParams.get('category');
    if (urlQ)   setQuery(urlQ);
    if (urlCat) setCatFilter(urlCat);
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      productAPI.getAll().then(r => setProducts(r.data?.data || [])),
      categoryAPI.getAll().then(r => {
        const cats = r.data;
        setCategories(Array.isArray(cats) ? cats : (cats?.data || []));
      }),
    ])
      .catch(() => setError('Failed to load products. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    products.filter(p => {
      const q = query.toLowerCase();
      const matchQuery = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
      const matchCat   = catFilter === 'all' || String(p.category_id) === String(catFilter);
      return matchQuery && matchCat;
    }),
    [products, query, catFilter]
  );

  useEffect(() => setPage(1), [query, catFilter]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  const handleAddToCart = (product, qty = 1) => {
    addToCart(product, qty);
    setCartOpen(true);
    setSelected(null);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 h-8 w-52 rounded-lg bg-slate-200 animate-pulse" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-center px-4">
        <div>
          <AlertCircle size={40} className="mx-auto mb-3 text-rose-400" />
          <p className="font-bold text-slate-700">{error}</p>
          <button onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-[#0f766e] px-6 py-2 text-sm font-bold text-white hover:bg-[#115e59]">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0f766e]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#0f766e] mb-3">
            <ShoppingBag size={12} />
            Our Store
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Browse Products</h1>
          <p className="mt-1.5 text-slate-500">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'} available
          </p>
        </div>

        {/* Search + Filter bar */}
        <div className="mb-8 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10 shadow-sm"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products by name or description…"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <select
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#0f766e] shadow-sm"
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name || c.category_name}</option>
            ))}
          </select>
        </div>

        {/* Category pill filters */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setCatFilter('all')}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                catFilter === 'all'
                  ? 'border-[#0f766e] bg-[#0f766e] text-white shadow-md shadow-[#0f766e]/20'
                  : 'border-slate-200 text-slate-600 hover:border-[#0f766e]/40 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setCatFilter(String(c.id))}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                  catFilter === String(c.id)
                    ? 'border-[#0f766e] bg-[#0f766e] text-white shadow-md shadow-[#0f766e]/20'
                    : 'border-slate-200 text-slate-600 hover:border-[#0f766e]/40 hover:bg-slate-50'
                }`}
              >
                {c.name || c.category_name}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-slate-100">
              <Package size={36} className="text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="text-xl font-bold text-slate-600">No products found</p>
            <p className="mt-1 text-sm text-slate-400">Try adjusting your search or category filter.</p>
            <button
              onClick={() => { setQuery(''); setCatFilter('all'); }}
              className="mt-5 rounded-xl border border-slate-200 px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onView={setSelected}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page <= 1}
              className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`size-9 rounded-xl border text-sm font-bold transition-all ${
                  p === page
                    ? 'border-[#0f766e] bg-[#0f766e] text-white shadow-md shadow-[#0f766e]/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
              className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selected && (
        <ProductModal
          product={selected}
          onClose={() => setSelected(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
}

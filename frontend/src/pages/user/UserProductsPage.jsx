import React, { useState, useEffect, useMemo } from 'react';
import { productAPI, categoryAPI, orderAPI } from '../../api';
import { fmtPKR } from '../../utils/currency';
import { Search, ShoppingCart, X, Plus, Minus, CheckCircle2, ShoppingBag, Tag, Layers, Package, Truck } from 'lucide-react';

function loadCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

export default function UserProductsPage() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery]           = useState('');
  const [catFilter, setCatFilter]   = useState('All');
  const [loading, setLoading]       = useState(true);
  const [cart, setCart]             = useState(loadCart);
  const [cartOpen, setCartOpen]     = useState(false);
  const [ordering, setOrdering]     = useState(false);
  const [orderMsg, setOrderMsg]     = useState('');
  const [orderErr, setOrderErr]     = useState('');
  const [address, setAddress]       = useState({ street: '', city: '', state: '', zip: '', country: 'Pakistan' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    Promise.all([
      productAPI.getAll().then((r) => setProducts(r.data?.data || [])),
      categoryAPI.getAll().then((r) => setCategories(r.data?.data || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const catOptions = ['All', ...categories.map((c) => c.category_name)];

  const [page, setPage] = useState(1);
  const perPage = 9;

  const filtered = useMemo(() => products.filter((p) => {
    const q = query.toLowerCase();
    return p.stock > 0
      && (p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
      && (catFilter === 'All' || p.category_name === catFilter);
  }), [products, query, catFilter]);

  useEffect(() => { setPage(1); }, [query, catFilter]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.qty + qty > product.stock) return prev;
        return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { product, qty }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) => prev
      .map((i) => i.product.id === productId ? { ...i, qty: Math.max(1, Math.min(i.qty + delta, i.product.stock)) } : i)
      .filter((i) => i.qty > 0)
    );
  };

  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => i.product.id !== productId));

  const cartTotal = cart.reduce((s, i) => s + parseFloat(i.product.price) * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    const { street, city, state, zip, country } = address;
    if (!street || !city) {
      setOrderErr('Please provide your shipping address (street and city required).');
      return;
    }
    setOrdering(true); setOrderMsg(''); setOrderErr('');
    try {
      const shipping_address = `${street}, ${city}${state ? ', ' + state : ''}${zip ? ' ' + zip : ''}, ${country}`;
      await orderAPI.create({
        items: cart.map((i) => ({ product_id: i.product.id, quantity: i.qty })),
        shipping_address,
        payment_method: paymentMethod,
      });
      setCart([]);
      setCartOpen(false);
      setOrderMsg('Order placed successfully! Check My Orders to track it.');
    } catch (err) {
      setOrderErr(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally { setOrdering(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-5">
      {orderMsg && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">{orderMsg}</p>
          <button className="ml-auto text-emerald-600" onClick={() => setOrderMsg('')}><X size={16} /></button>
        </div>
      )}

      {/* Header + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Browse Products</h2>
          <p className="text-sm text-slate-500">{filtered.length} products available</p>
        </div>
        <button
          className="relative inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#115e59]"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingCart size={17} />
          Cart
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{cartCount}</span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#0f766e]" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" />
        </div>
        <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#0f766e]" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          {catOptions.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="surface rounded-lg p-10 text-center">
          <p className="font-bold text-slate-500">No products found</p>
          <p className="mt-1 text-sm text-slate-400">Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginated.map((p) => {
            const inCart = cart.find((i) => i.product.id === p.id);
            return (
              <article key={p.id} onClick={() => setSelectedProduct(p)} className="surface rounded-lg p-4 flex flex-col group overflow-hidden relative border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="mb-3 h-40 w-full overflow-hidden rounded-lg bg-slate-50 flex items-center justify-center relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="text-slate-300 text-xs font-medium uppercase tracking-widest flex flex-col items-center gap-1">
                      <ShoppingBag size={24} className="opacity-50" />
                      No Image
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider">{p.category_name || '—'}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${p.stock <= 10 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {p.stock} left
                  </span>
                </div>
                <h3 className="mt-3 font-bold group-hover:text-[#0f766e] transition-colors line-clamp-1">{p.name}</h3>
                {p.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{p.description}</p>}
                <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                  <p className="text-lg font-bold text-[#0f766e]">{fmtPKR(p.price)}</p>
                  {inCart ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => updateQty(p.id, -1)}><Minus size={13} /></button>
                      <span className="w-6 text-center text-sm font-bold">{inCart.qty}</span>
                      <button className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => updateQty(p.id, 1)}><Plus size={13} /></button>
                    </div>
                  ) : (
                    <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f766e] px-3 py-2 text-xs font-bold text-white hover:bg-[#115e59]" onClick={(e) => { e.stopPropagation(); addToCart(p); }}>
                      <ShoppingCart size={13} /> Add to cart
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button className="rounded border border-slate-200 px-3 py-1.5 font-bold hover:bg-slate-50 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`rounded border px-3 py-1.5 font-bold hover:bg-slate-50 ${p === page ? 'bg-[#0f766e] text-white border-[#0f766e]' : 'border-slate-200'}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="rounded border border-slate-200 px-3 py-1.5 font-bold hover:bg-slate-50 disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
        </>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/35" onClick={() => setCartOpen(false)} />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2 className="font-bold">Your cart ({cartCount} items)</h2>
              <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" onClick={() => setCartOpen(false)}><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">Your cart is empty.</p>
              ) : (
                cart.map(({ product, qty }) => (
                  <div key={product.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{product.name}</p>
                      <p className="text-xs text-slate-500">{fmtPKR(product.price)} × {qty}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button className="grid size-6 place-items-center rounded border border-slate-200 text-slate-600" onClick={() => updateQty(product.id, -1)}><Minus size={11} /></button>
                      <span className="w-5 text-center text-xs font-bold">{qty}</span>
                      <button className="grid size-6 place-items-center rounded border border-slate-200 text-slate-600" onClick={() => updateQty(product.id, 1)}><Plus size={11} /></button>
                    </div>
                    <button className="text-slate-400 hover:text-rose-500" onClick={() => removeFromCart(product.id)}><X size={15} /></button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="border-t border-slate-200 p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Shipping Address</p>
                  <input className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#0f766e]" placeholder="Street address *" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} />
                  <div className="flex gap-2">
                    <input className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#0f766e]" placeholder="City *" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} />
                    <input className="h-9 w-20 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#0f766e]" placeholder="State" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} />
                    <input className="h-9 w-24 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#0f766e]" placeholder="Postal" value={address.zip} onChange={(e) => setAddress({...address, zip: e.target.value})} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Payment Method</p>
                  <select 
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#0f766e] bg-white font-medium"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash on Delivery</option>
                    <option value="easypaisa">EasyPaisa</option>
                    <option value="card">Credit / Debit Card</option>
                  </select>
                </div>
              </div>
            )}
            <div className="border-t border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between font-bold">
                <span>Total</span>
                <span className="text-[#0f766e]">{fmtPKR(cartTotal)}</span>
              </div>
              {orderErr && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{orderErr}</p>}
              <button
                className="w-full rounded-lg bg-[#0f766e] py-3 text-sm font-bold text-white hover:bg-[#115e59] disabled:opacity-60"
                onClick={placeOrder}
                disabled={cart.length === 0 || ordering}
              >
                {ordering ? 'Placing order…' : 'Place order'}
              </button>
            </div>
          </aside>
        </>
      )}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose, onAddToCart }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const inStock = product.stock > 0;

  const handleAdd = () => {
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

function Spinner() { return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f766e]" /></div>; }

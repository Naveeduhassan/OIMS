import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { productAPI } from '../../api';
import { fmtPKR } from '../../utils/currency';
import { Search, PackagePlus, Edit3, ChevronRight, Filter, Trash2 } from 'lucide-react';

function stockStatus(stock, threshold = 10) {
  if (stock === 0) return 'Out of stock';
  if (stock <= threshold) return 'Low stock';
  return 'Healthy';
}

export default function InventoryPage({ onViewProduct, onAddProduct, refreshKey = 0 }) {
  const [products, setProducts]         = useState([]);
  const [query, setQuery]               = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [page, setPage]                 = useState(1);
  const perPage = 10;

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productAPI.getAll();
      setProducts(res.data?.data || []);
    } catch { setError('Failed to load products'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts, refreshKey]);

  const categories = useMemo(() => ['All', ...new Set(products.map((p) => p.category_name).filter(Boolean))], [products]);

  const filtered = useMemo(() => products.filter((p) => {
    const q = query.toLowerCase();
    const matchQ = p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    const s = stockStatus(p.stock);
    return matchQ && (statusFilter === 'All' || s === statusFilter) && (categoryFilter === 'All' || p.category_name === categoryFilter);
  }), [products, query, statusFilter, categoryFilter]);

  useEffect(() => { setPage(1); }, [query, statusFilter, categoryFilter]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await productAPI.delete(id); fetchProducts(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to delete product.'); }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={error} />;

  return (
    <section className="surface rounded-lg p-4">
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="font-bold">Product inventory</h2>
          <p className="text-sm text-slate-500">{filtered.length} of {products.length} products</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative w-full sm:w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#0f766e]" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" />
          </div>
          <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {['All', 'Healthy', 'Low stock', 'Out of stock'].map((o) => <option key={o}>{o}</option>)}
          </select>
          <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map((o) => <option key={o}>{o}</option>)}
          </select>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f766e] px-3 py-2 text-sm font-bold text-white hover:bg-[#115e59]" onClick={onAddProduct}>
            <PackagePlus size={15} /> Add
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border border-slate-200 lg:block">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Price (PKR)</th>
              <th className="px-4 py-3">Value (PKR)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((p) => {
              const status = stockStatus(p.stock, p.reorder_threshold);
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <button className="font-bold text-left hover:text-[#0f766e] transition-colors" onClick={() => onViewProduct?.(p)}>{p.name}</button>
                    {p.description && <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.category_name || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={status} /></td>
                  <td className="px-4 py-3 font-bold">{p.stock}</td>
                  <td className="px-4 py-3">{fmtPKR(p.price)}</td>
                  <td className="px-4 py-3 font-semibold">{fmtPKR(parseFloat(p.price) * p.stock)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-white" onClick={() => onViewProduct?.(p)} aria-label="View"><Edit3 size={14} /></button>
                      <button className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-white" onClick={() => onViewProduct?.(p)} aria-label="Open"><ChevronRight size={14} /></button>
                      <button className="rounded-lg border border-rose-200 p-1.5 text-rose-500 hover:bg-rose-50" onClick={() => handleDelete(p.id, p.name)} aria-label="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState />}
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-1">
          <button className="rounded border border-slate-200 px-3 py-1.5 font-bold hover:bg-slate-50 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`rounded border px-3 py-1.5 font-bold hover:bg-slate-50 ${p === page ? 'bg-[#0f766e] text-white border-[#0f766e]' : 'border-slate-200'}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="rounded border border-slate-200 px-3 py-1.5 font-bold hover:bg-slate-50 disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 lg:hidden">
        {paginated.map((p) => {
          const status = stockStatus(p.stock, p.reorder_threshold);
          return (
            <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold">{p.name}</p>
                <StatusBadge status={status} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <MiniStat label="Stock" value={p.stock} />
                <MiniStat label="Price" value={fmtPKR(p.price)} />
                <MiniStat label="Value" value={fmtPKR(parseFloat(p.price) * p.stock)} />
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50" onClick={() => onViewProduct?.(p)}>Edit</button>
                <button className="flex-1 rounded-lg border border-rose-200 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(p.id, p.name)}>Delete</button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <EmptyState />}
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const s = { Healthy: 'border-emerald-200 bg-emerald-50 text-emerald-700', 'Low stock': 'border-amber-200 bg-amber-50 text-amber-800', 'Out of stock': 'border-rose-200 bg-rose-50 text-rose-700' };
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${s[status] || s.Healthy}`}>{status}</span>;
}
function MiniStat({ label, value }) {
  return <div className="rounded bg-slate-50 p-2"><p className="text-xs text-slate-400">{label}</p><p className="mt-0.5 text-xs font-bold">{value}</p></div>;
}
function EmptyState() {
  return <div className="grid place-items-center bg-white p-10 text-center"><Filter className="mx-auto text-slate-300" size={28} /><p className="mt-2 font-bold text-sm">No products found</p></div>;
}
function Spinner() { return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f766e]" /></div>; }
function ErrorBox({ msg }) { return <div className="rounded-lg bg-red-50 p-4 text-red-600"><p className="font-bold">Error</p><p className="text-sm">{msg}</p></div>; }

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { stockAPI, productAPI } from '../../api';
import { ArrowDownUp, Search, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const CHANGE_TYPE_LABELS = {
  restock:             { label: 'Restock',            color: 'emerald' },
  purchase_order:      { label: 'Purchase Order',     color: 'blue' },
  order_fulfillment:   { label: 'Order Sale',         color: 'rose' },
  order_cancellation:  { label: 'Order Cancellation', color: 'amber' },
  manual_adjustment:   { label: 'Manual Adjustment',  color: 'purple' },
  damaged:             { label: 'Damaged',            color: 'rose' },
  returned:            { label: 'Returned',           color: 'teal' },
};

const BADGE_COLORS = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue:    'bg-blue-50 text-blue-700 border-blue-200',
  rose:    'bg-rose-50 text-rose-700 border-rose-200',
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
  purple:  'bg-purple-50 text-purple-700 border-purple-200',
  teal:    'bg-teal-50 text-teal-700 border-teal-200',
  slate:   'bg-slate-50 text-slate-600 border-slate-200',
};

export default function MovementsPage() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dirFilter, setDirFilter] = useState('All'); // 'All' | 'In' | 'Out'

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const prodRes = await productAPI.getAll();
      const prods   = prodRes.data?.data || [];
      if (!prods.length) { setMovements([]); return; }

      const results = await Promise.all(
        prods.map((p) =>
          stockAPI.getHistory(p.id, { limit: 20 })
            .then((r) => (r.data?.data || []).map((e) => ({
              ...e,
              product_name: p.name,
              ts: new Date(e.created_at).getTime(),
            })))
            .catch(() => [])
        )
      );
      const flat = results.flat().sort((a, b) => b.ts - a.ts);
      setMovements(flat.slice(0, 200));
    } catch { setError('Failed to load movements'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const allTypes = useMemo(() => {
    const types = [...new Set(movements.map((m) => m.change_type))];
    return ['All', ...types];
  }, [movements]);

  const filtered = useMemo(() => movements.filter((m) => {
    const q = search.toLowerCase();
    const matchQ = (m.product_name || '').toLowerCase().includes(q) ||
                   (m.change_type || '').toLowerCase().includes(q) ||
                   (m.notes || '').toLowerCase().includes(q);
    const matchType = typeFilter === 'All' || m.change_type === typeFilter;
    const matchDir  = dirFilter === 'All' ||
                      (dirFilter === 'In'  && m.quantity > 0) ||
                      (dirFilter === 'Out' && m.quantity < 0);
    return matchQ && matchType && matchDir;
  }), [movements, search, typeFilter, dirFilter]);

  // Aggregate stats
  const totalIn  = filtered.filter((m) => m.quantity > 0).reduce((s, m) => s + m.quantity, 0);
  const totalOut = filtered.filter((m) => m.quantity < 0).reduce((s, m) => s + Math.abs(m.quantity), 0);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox msg={error} />;

  return (
    <section className="grid gap-4">
      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        <div className="surface rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-500">Total Entries</p>
          <p className="mt-1 text-2xl font-bold">{filtered.length}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <TrendingUp size={13} /> Stock In
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-700">+{totalIn}</p>
        </div>
        <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
          <div className="flex items-center gap-1 text-xs font-semibold text-rose-600">
            <TrendingDown size={13} /> Stock Out
          </div>
          <p className="mt-1 text-2xl font-bold text-rose-700">-{totalOut}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="surface rounded-lg p-3 flex flex-wrap gap-2 items-center">
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#0f766e]"
            placeholder="Search product, type, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {allTypes.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All Types' : (CHANGE_TYPE_LABELS[t]?.label || t.replace(/_/g, ' '))}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          value={dirFilter}
          onChange={(e) => setDirFilter(e.target.value)}
        >
          <option value="All">All Directions</option>
          <option value="In">Stock In (+)</option>
          <option value="Out">Stock Out (−)</option>
        </select>
        <button
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          onClick={load}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="surface rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No movements match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Change</th>
                  <th className="px-4 py-3">Before → After</th>
                  <th className="px-4 py-3">By</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e, i) => {
                  const typeInfo = CHANGE_TYPE_LABELS[e.change_type] || { label: e.change_type?.replace(/_/g, ' '), color: 'slate' };
                  const isIn = e.quantity > 0;
                  return (
                    <tr key={`${e.id}-${i}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold">{e.product_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold capitalize ${BADGE_COLORS[typeInfo.color]}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-bold text-base ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIn ? `+${e.quantity}` : e.quantity}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {e.stock_before} → {e.stock_after}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{e.created_by_name || 'System'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[180px] truncate">{e.notes || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(e.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Spinner() { return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f766e]" /></div>; }
function ErrorBox({ msg }) { return <div className="rounded-lg bg-red-50 p-4 text-red-600"><p className="font-bold">Error</p><p className="text-sm">{msg}</p></div>; }

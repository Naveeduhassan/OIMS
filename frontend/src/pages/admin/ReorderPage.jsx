import React, { useState, useEffect, useCallback } from 'react';
import { productAPI, poAPI, stockAPI } from '../../api';
import { fmtPKR } from '../../utils/currency';
import { AlertTriangle, ChevronRight, Zap, RefreshCw, Package, CheckCircle, Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export default function ReorderPage() {
  const [products, setProducts]   = useState([]);
  const [pos, setPOs]             = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [tab, setTab]             = useState('low'); // 'low' | 'pos'
  const [receiving, setReceiving] = useState(null);
  const [creating, setCreating]   = useState({});
  const [search, setSearch]       = useState('');
  const { openProduct }           = useOutletContext() || {};

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, poRes] = await Promise.all([
        productAPI.getAll(),
        poAPI.getAll(),
      ]);
      const allProducts = prodRes.data?.data || [];
      // Use each product's own reorder_threshold
      setProducts(allProducts.filter((p) => p.stock <= (p.reorder_threshold ?? 10)));
      setPOs(poRes.data?.data || []);
    } catch { setError('Failed to load reorder data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreatePO = async (product) => {
    setCreating((prev) => ({ ...prev, [product.id]: true }));
    try {
      await poAPI.create({
        product_id:  product.id,
        supplier_id: product.supplier_id || null,
        quantity:    product.reorder_quantity ?? 50,
      });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create PO.');
    } finally {
      setCreating((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const handleReceivePO = async (poId) => {
    setReceiving(poId);
    try {
      await poAPI.receive(poId);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to receive PO.');
    } finally {
      setReceiving(null);
    }
  };

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox msg={error} />;

  const pendingPOs   = pos.filter((p) => p.status === 'pending');
  const receivedPOs  = pos.filter((p) => p.status === 'received');

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPOs = pos.filter((p) =>
    (p.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid gap-4">
      {/* KPI bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Low Stock Items"  value={products.length}  color="amber"   icon={<AlertTriangle size={16} />} />
        <KPI label="Pending POs"      value={pendingPOs.length}  color="blue"    icon={<Package size={16} />} />
        <KPI label="Received POs"     value={receivedPOs.length} color="emerald" icon={<CheckCircle size={16} />} />
        <KPI label="Total POs"        value={pos.length}         color="slate"   icon={<RefreshCw size={16} />} />
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between surface rounded-lg p-3">
        <div className="flex gap-1">
          {[['low', 'Low Stock'], ['pos', 'Purchase Orders']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                tab === key
                  ? 'bg-[#0f766e] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
              {key === 'low' && products.length > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white">{products.length}</span>
              )}
              {key === 'pos' && pendingPOs.length > 0 && (
                <span className="ml-1.5 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs text-white">{pendingPOs.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#0f766e] sm:w-56"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* LOW STOCK TAB */}
      {tab === 'low' && (
        <>
          {filteredProducts.length === 0 ? (
            <div className="surface rounded-lg p-10 text-center">
              <CheckCircle className="mx-auto text-emerald-500" size={36} />
              <p className="mt-3 font-bold text-emerald-700">All products are well stocked ✓</p>
              <p className="mt-1 text-sm text-slate-500">No items below their individual reorder thresholds.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((p) => {
                const hasPendingPO = pos.some((po) => po.product_name === p.name && po.status === 'pending');
                return (
                  <article key={p.id} className="surface rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`grid size-10 place-items-center rounded-lg ${p.stock === 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                        <AlertTriangle size={18} />
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${p.stock === 0 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                        {p.stock === 0 ? 'Out of stock' : 'Low stock'}
                      </span>
                    </div>
                    <h2 className="mt-3 font-bold">{p.name}</h2>
                    <p className="text-xs text-slate-500">{p.category_name || '—'} · {p.supplier_name ? `Supplier: ${p.supplier_name}` : 'No supplier'}</p>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <MiniStat label="On hand"   value={p.stock} />
                      <MiniStat label="Threshold" value={`≤ ${p.reorder_threshold ?? 10}`} />
                      <MiniStat label="Order qty" value={p.reorder_quantity ?? 50} />
                    </div>

                    {hasPendingPO && (
                      <p className="mt-2 flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs text-blue-700 font-semibold">
                        <Zap size={11} /> Pending PO already exists
                      </p>
                    )}

                    <div className="mt-3 flex gap-2">
                      <button
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#0f766e] py-2 text-xs font-bold text-white hover:bg-[#115e59] disabled:opacity-60"
                        disabled={creating[p.id] || hasPendingPO}
                        onClick={() => handleCreatePO(p)}
                      >
                        <Zap size={13} />
                        {creating[p.id] ? 'Creating…' : hasPendingPO ? 'PO Exists' : 'Create PO'}
                      </button>
                      <button
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        onClick={() => openProduct?.(p)}
                      >
                        <ChevronRight size={13} /> Details
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* PURCHASE ORDERS TAB */}
      {tab === 'pos' && (
        <div className="surface rounded-lg overflow-hidden">
          {filteredPOs.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No purchase orders yet.</p>
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">PO #</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#0f766e]">#{po.id}</td>
                    <td className="px-4 py-3 font-medium">{po.product_name}</td>
                    <td className="px-4 py-3 text-slate-500">{po.supplier_name || '—'}</td>
                    <td className="px-4 py-3 font-bold">{po.quantity}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(po.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <POBadge status={po.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {po.status === 'pending' ? (
                        <button
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                          disabled={receiving === po.id}
                          onClick={() => handleReceivePO(po.id)}
                        >
                          <CheckCircle size={12} />
                          {receiving === po.id ? 'Receiving…' : 'Mark Received'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, color, icon }) {
  const colors = {
    amber:   'bg-amber-50 border-amber-100 text-amber-700',
    blue:    'bg-blue-50 border-blue-100 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    slate:   'bg-slate-50 border-slate-200 text-slate-700',
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold opacity-70">{icon} {label}</div>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded bg-slate-50 p-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs font-bold">{value}</p>
    </div>
  );
}

function POBadge({ status }) {
  const cls = {
    pending:  'border-blue-200 bg-blue-50 text-blue-700',
    received: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold capitalize ${cls[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function Spinner() { return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f766e]" /></div>; }
function ErrorBox({ msg }) { return <div className="rounded-lg bg-red-50 p-4 text-red-600"><p className="font-bold">Error</p><p className="text-sm">{msg}</p></div>; }

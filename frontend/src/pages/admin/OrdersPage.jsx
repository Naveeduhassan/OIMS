import React, { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../../api';
import { fmtPKR } from '../../utils/currency';
import { ClipboardList } from 'lucide-react';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const STATUS_CLS = {
  pending:   'border-amber-200 bg-amber-50 text-amber-800',
  confirmed: 'border-blue-200 bg-blue-50 text-blue-700',
  shipped:   'border-purple-200 bg-purple-50 text-purple-700',
  delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function OrdersPage() {
  const [orders, setOrders]     = useState([]);
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [updating, setUpdating] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getAll();
      setOrders(res.data?.data || []);
    } catch { setError('Failed to load orders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [filter]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await orderAPI.updateStatus(id, status);
      fetchOrders();
    } catch (err) { alert(err.response?.data?.error || 'Failed to update status.'); }
    finally { setUpdating(null); }
  };

  const handleBulkUpdate = async (status) => {
    if (selected.size === 0) return;
    if (!window.confirm(`Mark ${selected.size} orders as ${status}?`)) return;
    setLoading(true);
    try {
      for (let id of selected) {
        await orderAPI.updateStatus(id, status);
      }
      setSelected(new Set());
      fetchOrders();
    } catch (err) { alert('Some bulk updates failed.'); fetchOrders(); }
  };

  const cancelOrder = async (id) => {
    if (!window.confirm('Cancel this order?')) return;
    try { await orderAPI.cancel(id); fetchOrders(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to cancel order.'); }
  };

  const displayed = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const totalPages = Math.ceil(displayed.length / perPage) || 1;
  const paginated = displayed.slice((page - 1) * perPage, page * perPage);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox msg={error} />;

  return (
    <section className="surface rounded-lg p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold">All orders</h2>
          <p className="text-sm text-slate-500">{displayed.length} order{displayed.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...STATUSES].map((s) => (
            <button key={s} className={`rounded-full border px-3 py-1 text-xs font-bold capitalize transition ${filter === s ? 'border-[#0f766e] bg-[#e8f5f3] text-[#0f766e]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} onClick={() => setFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      
      {selected.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-[#e8f5f3] p-3 border border-[#0f766e]/20">
          <span className="text-sm font-bold text-[#0f766e]">{selected.size} selected</span>
          <div className="flex gap-2">
            <button className="rounded bg-[#0f766e] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#115e59]" onClick={() => handleBulkUpdate('shipped')}>Mark Shipped</button>
            <button className="rounded bg-[#0f766e] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#115e59]" onClick={() => handleBulkUpdate('delivered')}>Mark Delivered</button>
          </div>
        </div>
      )}

      {displayed.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No orders found.</p>
      ) : (
        <><div className="space-y-3">
          {paginated.map((o) => (
            <div key={o.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="size-4 rounded border-slate-300 text-[#0f766e]" checked={selected.has(o.id)} onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(o.id);
                    else next.delete(o.id);
                    setSelected(next);
                  }} />
                  <div>
                    <p className="font-bold">Order #{o.id}</p>
                    <p className="text-xs text-slate-500">{o.full_name || 'Unknown'} • {new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={o.status} />
                  {o.status !== 'cancelled' && o.status !== 'delivered' && (
                    <select
                      className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none"
                      value={o.status}
                      disabled={updating === o.id}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                    >
                      {STATUSES.filter((s) => s !== 'cancelled').map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  )}
                  {o.status !== 'cancelled' && o.status !== 'delivered' && (
                    <button className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50" onClick={() => cancelOrder(o.id)}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MiniStat label="Total" value={fmtPKR(o.total_amount)} />
                <MiniStat label="Status" value={o.status} />
                <MiniStat label="Date" value={new Date(o.created_at).toLocaleDateString()} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
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
    </section>
  );
}

function StatusBadge({ status }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${STATUS_CLS[status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>{status}</span>;
}
function MiniStat({ label, value }) {
  return <div className="rounded bg-slate-50 p-2"><p className="text-xs text-slate-400">{label}</p><p className="mt-0.5 text-sm font-semibold capitalize">{value}</p></div>;
}
function Spinner() { return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f766e]" /></div>; }
function ErrorBox({ msg }) { return <div className="rounded-lg bg-red-50 p-4 text-red-600"><p className="font-bold">Error</p><p className="text-sm">{msg}</p></div>; }

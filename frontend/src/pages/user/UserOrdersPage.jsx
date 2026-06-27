import React, { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../../api';
import { fmtPKR } from '../../utils/currency';
import { ClipboardList, X } from 'lucide-react';

const STATUS_CLS = {
  pending:   'border-amber-200 bg-amber-50 text-amber-800',
  confirmed: 'border-blue-200 bg-blue-50 text-blue-700',
  shipped:   'border-purple-200 bg-purple-50 text-purple-700',
  delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function UserOrdersPage() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [page, setPage]         = useState(1);
  const perPage = 5;

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
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">My Orders</h2>
          <p className="text-sm text-slate-500">{orders.length} total order{orders.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <button key={s} className={`rounded-full border px-3 py-1 text-xs font-bold capitalize transition ${filter === s ? 'border-[#0f766e] bg-[#e8f5f3] text-[#0f766e]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} onClick={() => setFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="surface rounded-lg p-10 text-center">
          <ClipboardList className="mx-auto text-slate-300" size={36} />
          <p className="mt-3 font-bold text-slate-500">No orders found</p>
          <p className="mt-1 text-sm text-slate-400">
            {filter === 'all' ? "You haven't placed any orders yet." : `No ${filter} orders.`}
          </p>
        </div>
      ) : (
        <>
        <div className="space-y-3">
          {paginated.map((o) => (
            <div key={o.id} className="surface rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">Order #{o.id}</p>
                  <p className="text-xs text-slate-500">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={o.status} />
                  {o.status === 'pending' && (
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

              <div className="mt-3">
                <OrderTimeline status={o.status} />
              </div>

              <button
                className="mt-3 text-xs font-semibold text-[#0f766e] hover:underline"
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
              >
                {expanded === o.id ? 'Hide details ↑' : 'View details ↓'}
              </button>

              {expanded === o.id && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Order details</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Order ID</span><span className="font-semibold">#{o.id}</span></div>
                    {o.shipping_address && <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span className="font-semibold text-right max-w-[200px]">{o.shipping_address}</span></div>}
                    <div className="flex justify-between"><span className="text-slate-500">Total amount</span><span className="font-semibold">{fmtPKR(o.total_amount)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Placed on</span><span className="font-semibold">{new Date(o.created_at).toLocaleString()}</span></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {totalPages > 1 && (
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
        )}
        </>
      )}
    </div>
  );
}

function OrderTimeline({ status }) {
  const steps = ['pending', 'confirmed', 'shipped', 'delivered'];
  const cancelled = status === 'cancelled';
  const currentIdx = steps.indexOf(status);

  if (cancelled) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2">
        <X size={14} className="text-rose-500" />
        <span className="text-xs font-semibold text-rose-700">Order cancelled</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className={`flex flex-col items-center gap-1 ${i <= currentIdx ? 'text-[#0f766e]' : 'text-slate-300'}`}>
            <div className={`size-2.5 rounded-full ${i <= currentIdx ? 'bg-[#0f766e]' : 'bg-slate-200'}`} />
            <span className="text-[9px] font-bold capitalize hidden sm:block">{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mb-3 ${i < currentIdx ? 'bg-[#0f766e]' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
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

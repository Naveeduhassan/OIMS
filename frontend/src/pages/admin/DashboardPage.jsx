import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { productAPI, orderAPI, stockAPI } from '../../api';
import { fmtPKR } from '../../utils/currency';
import {
  Warehouse, Boxes, AlertTriangle, ShoppingCart,
  ArrowDownUp, ClipboardList, Building2, TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { openProduct } = useOutletContext() || {};

  const [products, setProducts]         = useState([]);
  const [lowStock, setLowStock]         = useState([]);
  const [totalValue, setTotalValue]     = useState(0);
  const [units, setUnits]               = useState(0);
  const [allOrders, setAllOrders]       = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [movements, setMovements]       = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, ordRes] = await Promise.all([
          productAPI.getAll(),
          orderAPI.getAll().catch(() => ({ data: { data: [] } })),
        ]);

        const prods = prodRes.data?.data || [];
        const ords  = ordRes.data?.data  || [];

        setProducts(prods);
        setLowStock(prods.filter((p) => p.stock <= 10));
        setTotalValue(prods.reduce((s, p) => s + parseFloat(p.price) * p.stock, 0));
        setUnits(prods.reduce((s, p) => s + p.stock, 0));
        setAllOrders(ords);
        setRecentOrders(ords.slice(0, 4));
        setPendingCount(ords.filter((o) => o.status === 'pending').length);

        // Recent movements from first 4 products
        const top = prods.slice(0, 4);
        const hist = await Promise.all(
          top.map((p) =>
            stockAPI.getHistory(p.id, { limit: 2 })
              .then((r) => (r.data?.data || []).map((e) => ({ ...e, product_name: p.name })))
              .catch(() => [])
          )
        );
        const flat = hist.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setMovements(flat.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Derived values (must be before any early return) ────────────────
  const catMap = {};
  products.forEach((p) => { const c = p.category_name || 'Other'; catMap[c] = (catMap[c] || 0) + p.stock; });
  const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const catMax = catEntries[0]?.[1] || 1;

  // Chart data (Revenue over time) — must be before early return
  const chartData = useMemo(() => {
    const data = {};
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      data[d.toISOString().split('T')[0]] = { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: 0 };
    }
    allOrders.forEach(o => {
      const dateKey = new Date(o.created_at).toISOString().split('T')[0];
      if (data[dateKey]) {
        data[dateKey].revenue += parseFloat(o.total_amount || 0);
      }
    });
    return Object.values(data);
  }, [allOrders]);

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-5">
      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Inventory Value"  value={fmtPKR(totalValue)}   detail="Total stock value"           icon={Warehouse}    tone="teal" />
        <KpiCard title="Units on Hand"    value={units.toLocaleString()} detail="Across all products"        icon={Boxes}        tone="blue" />
        <KpiCard title="Low Stock Items"  value={lowStock.length}       detail="Need reorder action"         icon={AlertTriangle} tone="amber" />
        <KpiCard title="Pending Orders"   value={pendingCount}          detail="Awaiting processing"         icon={ShoppingCart} tone="rose" />
      </section>

      {/* Revenue Chart */}
      <section className="surface rounded-lg p-5 border border-slate-100">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Revenue Trend</h2>
            <p className="text-xs text-slate-500">Last 14 days total order amounts.</p>
          </div>
          <TrendingUp className="text-[#0f766e]" size={20} />
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `Rs ${val / 1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [fmtPKR(value), "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        {/* Attention queue */}
        <div className="surface rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold">Low stock queue</h2>
              <p className="text-xs text-slate-500">Products needing immediate reorder.</p>
            </div>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50" onClick={() => navigate('/admin/reorder')}>
              View all
            </button>
          </div>
          {lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">All products are well stocked ✓</p>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 5).map((p) => (
                <button key={p.id} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-[#0f766e]/40 hover:bg-[#f5fbfa]" onClick={() => openProduct?.(p)}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${p.stock === 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                      <AlertTriangle size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.category_name || '—'}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold">{p.stock} units</p>
                    <StockBadge stock={p.stock} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="surface rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Category breakdown</h2>
            <Building2 className="text-slate-400" size={18} />
          </div>
          {catEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No products yet.</p>
          ) : (
            <div className="space-y-4">
              {catEntries.map(([name, count]) => (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold">{name}</span>
                    <span className="text-slate-500">{count} units</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-[#0f766e]" style={{ width: `${Math.round((count / catMax) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Recent movements */}
        <div className="surface rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold">Recent movements</h2>
              <p className="text-xs text-slate-500">Latest stock history entries.</p>
            </div>
            <ArrowDownUp className="text-slate-400" size={18} />
          </div>
          {movements.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No movement history yet.</p>
          ) : (
            <div className="space-y-2">
              {movements.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold capitalize">{e.change_type.replace(/_/g, ' ')}: {e.product_name}</p>
                    <p className="text-xs text-slate-500">{new Date(e.created_at).toLocaleString()}</p>
                  </div>
                  <span className="font-bold text-slate-700">±{e.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="surface rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold">Recent orders</h2>
              <p className="text-xs text-slate-500">Latest customer orders.</p>
            </div>
            <ClipboardList className="text-slate-400" size={18} />
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm">Order #{o.id}</p>
                    <OrderBadge status={o.status} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-slate-50 p-1.5"><p className="text-slate-400">Customer</p><p className="font-semibold">{o.full_name || '—'}</p></div>
                    <div className="rounded bg-slate-50 p-1.5"><p className="text-slate-400">Total</p><p className="font-semibold">{fmtPKR(o.total_amount)}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, detail, icon: Icon, tone }) {
  const tones = { teal: 'bg-[#e8f5f3] text-[#0f766e]', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700' };
  return (
    <article className="surface rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">{title}</p>
          <p className="mt-1.5 text-2xl font-bold">{value}</p>
        </div>
        <span className={`grid size-10 place-items-center rounded-lg ${tones[tone]}`}><Icon size={20} /></span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function StockBadge({ stock }) {
  if (stock === 0) return <span className="text-xs font-bold text-rose-600">Out of stock</span>;
  return <span className="text-xs font-bold text-amber-600">Low stock</span>;
}

function OrderBadge({ status }) {
  const cls = { pending: 'bg-amber-50 text-amber-700', confirmed: 'bg-blue-50 text-blue-700', shipped: 'bg-purple-50 text-purple-700', delivered: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-rose-50 text-rose-700' };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${cls[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

function Spinner() {
  return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f766e]" /></div>;
}

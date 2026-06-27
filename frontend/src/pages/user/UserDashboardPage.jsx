import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { productAPI, orderAPI } from '../../api';
import { fmtPKR } from '../../utils/currency';
import { ShoppingBag, ClipboardList, PackageCheck, AlertTriangle } from 'lucide-react';

const STATUS_CLS = {
  pending:   'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  shipped:   'bg-purple-50 text-purple-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700',
};

export default function UserDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts]   = useState([]);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      productAPI.getAll().then((r) => setProducts(r.data?.data || [])).catch(() => {}),
      orderAPI.getAll().then((r) => setOrders(r.data?.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const recentOrders   = orders.slice(0, 3);
  const featuredProds  = products.filter((p) => p.stock > 0).slice(0, 4);
  const totalSpent     = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + parseFloat(o.total_amount), 0);

  return (
    <div className="grid gap-5">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#0f766e] to-[#0d9488] p-6 text-white">
        <p className="text-sm font-semibold opacity-80">Welcome back</p>
        <h1 className="mt-1 text-2xl font-bold">{user?.full_name || 'Customer'}</h1>
        <p className="mt-1 text-sm opacity-75">Browse products and track your orders below.</p>
      </div>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total orders" value={orders.length} icon={ClipboardList} color="blue" />
        <StatCard label="Total spent" value={fmtPKR(totalSpent)} icon={PackageCheck} color="teal" />
        <StatCard label="Pending orders" value={orders.filter((o) => o.status === 'pending').length} icon={AlertTriangle} color="amber" />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Featured products */}
        <div className="surface rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Browse products</h2>
            <button className="text-xs font-semibold text-[#0f766e] hover:underline" onClick={() => navigate('/portal/products')}>View all →</button>
          </div>
          {featuredProds.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No products available.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {featuredProds.map((p) => (
                <button key={p.id} className="rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-[#0f766e]/40 hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden relative group" onClick={() => navigate('/portal/products')}>
                  <div className="mb-3 h-28 w-full overflow-hidden rounded bg-slate-50 flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <span className="grid size-9 place-items-center rounded-lg bg-[#e8f5f3] text-[#0f766e]"><ShoppingBag size={16} /></span>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm line-clamp-1 group-hover:text-[#0f766e] transition-colors">{p.name}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 whitespace-nowrap">{p.stock} left</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{p.category_name || '—'}</p>
                  <p className="mt-2 font-extrabold text-[#0f766e] text-base">{fmtPKR(p.price)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="surface rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Recent orders</h2>
            <button className="text-xs font-semibold text-[#0f766e] hover:underline" onClick={() => navigate('/portal/orders')}>View all →</button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">No orders yet.</p>
              <button className="mt-3 rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-bold text-white hover:bg-[#115e59]" onClick={() => navigate('/portal/products')}>
                Shop now
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm">Order #{o.id}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${STATUS_CLS[o.status] || 'bg-slate-100 text-slate-600'}`}>{o.status}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(o.created_at).toLocaleDateString()}</span>
                    <span className="font-bold text-slate-700">{fmtPKR(o.total_amount)}</span>
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

function StatCard({ label, value, icon: Icon, color }) {
  const colors = { teal: 'bg-[#e8f5f3] text-[#0f766e]', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700' };
  return (
    <article className="surface rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1.5 text-xl font-bold">{value}</p></div>
        <span className={`grid size-9 place-items-center rounded-lg ${colors[color]}`}><Icon size={18} /></span>
      </div>
    </article>
  );
}
function Spinner() { return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f766e]" /></div>; }

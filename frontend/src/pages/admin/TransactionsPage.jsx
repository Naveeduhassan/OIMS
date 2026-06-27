import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../../api';
import { fmtPKR } from '../../utils/currency';
import { Receipt, Search, Filter } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updating, setUpdating] = useState(null);

  const loadTransactions = () => {
    transactionAPI.getAll()
      .then((res) => {
        setTransactions(res.data?.data || []);
      })
      .catch((err) => setError('Failed to load transactions.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await transactionAPI.updatePaymentStatus(id, newStatus);
      loadTransactions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update payment status');
    } finally {
      setUpdating(null);
    }
  };

  // Filter transactions
  const filtered = transactions.filter((t) => {
    const q = query.toLowerCase();
    const matchId = String(t.id).includes(q) || String(t.order_id).includes(q) || (t.full_name || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || t.payment_status === statusFilter.toLowerCase();
    return matchId && matchStatus;
  });

  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={error} />;

  const totalValue = filtered.reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0);

  return (
    <section className="surface rounded-lg p-4">
      {/* Header and KPI */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Transactions</h2>
          <p className="text-sm text-slate-500">{filtered.length} transactions found</p>
        </div>
        <div className="rounded-lg bg-emerald-50 px-4 py-2 border border-emerald-100">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Filtered Revenue</p>
          <p className="text-xl font-bold text-emerald-700">{fmtPKR(totalValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#0f766e]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Trans ID, Order ID or Customer..."
          />
        </div>
        <select
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {['All', 'Unpaid', 'Paid', 'Failed', 'Refunded'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse bg-white text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Trans ID</th>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Payment Info</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Payment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-[#0f766e]">#{t.id}</td>
                <td className="px-4 py-3 font-semibold text-slate-600">#{t.order_id}</td>
                <td className="px-4 py-3 text-slate-600">{t.created_at ? new Date(t.created_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 font-medium">{t.full_name || '—'}</td>
                <td className="px-4 py-3 text-slate-600 capitalize">
                  {t.payment_method || 'Cash'}
                </td>
                <td className="px-4 py-3 font-bold text-slate-900">{fmtPKR(t.total_amount)}</td>
                <td className="px-4 py-3">
                  <select
                    className="h-8 rounded border border-slate-200 bg-white px-2 text-xs font-bold capitalize outline-none"
                    value={t.payment_status}
                    disabled={updating === t.id}
                    onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  <Filter className="mx-auto mb-2 opacity-50" size={32} />
                  No transactions match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Spinner() { return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f766e]" /></div>; }
function ErrorBox({ msg }) { return <div className="rounded-lg bg-red-50 p-4 text-red-600"><p className="font-bold">Error</p><p className="text-sm">{msg}</p></div>; }

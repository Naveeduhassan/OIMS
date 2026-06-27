import React, { useEffect, useState } from 'react';
import { X, Edit3, Package } from 'lucide-react';
import { stockAPI } from '../api';
import { fmtPKR } from '../utils/currency';

export default function ProductDrawer({ product, open, onClose, onEdit }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (product?.id && open) {
      stockAPI.getHistory(product.id, { limit: 5 })
        .then((res) => setHistory(res.data?.data || []))
        .catch(() => setHistory([]));
    }
  }, [product?.id, open]);

  if (!product) return null;

  const statusColor =
    product.stock === 0
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : product.stock <= 10
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  const statusLabel =
    product.stock === 0 ? 'Out of stock' : product.stock <= 10 ? 'Low stock' : 'In stock';

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/35 transition ${open ? 'block' : 'hidden'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-48 shrink-0 items-center justify-center bg-slate-50 relative overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <Package size={56} className="text-slate-200" strokeWidth={1} />
          )}
        </div>
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <p className="text-sm font-semibold text-[#0f766e]">Product detail</p>
            <h2 className="mt-1 text-xl font-bold">{product.name}</h2>
          </div>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusColor}`}>
            {statusLabel}
          </span>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat label="Category" value={product.category_name || '—'} />
            <Stat label="Supplier" value={product.supplier_name || '—'} />
            <Stat label="Stock" value={product.stock} />
            <Stat label="Price" value={fmtPKR(product.price)} />
            <Stat label="Inventory value" value={fmtPKR(product.price * product.stock)} />
          </div>

          <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">Auto-Reorder Settings</p>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Reorder Threshold" value={`≤ ${product.reorder_threshold ?? 10} units`} />
              <Stat label="Reorder Quantity" value={`${product.reorder_quantity ?? 50} units`} />
            </div>
            <p className="mt-2 text-xs text-amber-700">
              {product.supplier_name
                ? `When stock hits threshold, a PO for ${product.reorder_quantity ?? 50} units will be sent to ${product.supplier_name}.`
                : 'Assign a supplier to enable Auto-PO.'}
            </p>
          </div>

          {product.description && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold">Description</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{product.description}</p>
            </div>
          )}

          <div className="mt-5">
            <h3 className="font-bold">Recent stock movements</h3>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No movement history yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {history.map((entry) => (
                  <div key={entry.id} className="flex justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                    <span className="capitalize text-slate-600">{entry.change_type.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}</span>
                    <span className="text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 p-5">
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 py-3 text-sm font-bold text-white hover:bg-[#115e59]"
            onClick={onEdit}
          >
            <Edit3 size={17} />
            Edit product
          </button>
        </div>
      </aside>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

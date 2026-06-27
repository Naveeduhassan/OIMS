import React, { useState, useEffect, useCallback } from 'react';
import { supplierAPI } from '../../api';
import { Truck, Plus, X, Edit3, Trash2 } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState({ supplier_name: '', phone: '', address: '' });
  const [saving, setSaving]       = useState(false);
  const [formErr, setFormErr]     = useState('');

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await supplierAPI.getAll();
      setSuppliers(res.data?.data || []);
    } catch { setError('Failed to load suppliers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openAdd = () => { setEditing(null); setForm({ supplier_name: '', phone: '', address: '' }); setFormErr(''); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ supplier_name: s.supplier_name, phone: s.phone || '', address: s.address || '' }); setFormErr(''); setModal(true); };

  const handleSave = async () => {
    if (!form.supplier_name.trim()) { setFormErr('Supplier name is required.'); return; }
    setSaving(true);
    try {
      if (editing) await supplierAPI.update(editing.id, form);
      else await supplierAPI.create(form);
      setModal(false);
      fetchSuppliers();
    } catch (err) { setFormErr(err.response?.data?.error || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete supplier "${name}"?`)) return;
    try { await supplierAPI.delete(id); fetchSuppliers(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to delete.'); }
  };

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox msg={error} />;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}</p>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f766e] px-3 py-2 text-sm font-bold text-white hover:bg-[#115e59]" onClick={openAdd}>
          <Plus size={15} /> Add supplier
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((s) => (
          <article key={s.id} className="surface rounded-lg p-4">
            <div className="flex items-start justify-between gap-2">
              <Truck className="mt-0.5 shrink-0 text-[#0f766e]" size={20} />
              <div className="flex gap-1 ml-auto">
                <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => openEdit(s)}><Edit3 size={14} /></button>
                <button className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(s.id, s.supplier_name)}><Trash2 size={14} /></button>
              </div>
            </div>
            <h2 className="mt-3 font-bold">{s.supplier_name}</h2>
            <div className="mt-3 space-y-1.5">
              <Row label="Phone" value={s.phone || '—'} />
              <Row label="Address" value={s.address || '—'} />
            </div>
          </article>
        ))}
        {suppliers.length === 0 && <p className="col-span-full py-10 text-center text-sm text-slate-400">No suppliers yet.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-lg bg-white shadow-2xl flex flex-col my-auto" style={{maxHeight: 'calc(100vh - 2rem)'}}>
            <div className="flex items-center justify-between border-b border-slate-200 p-5 shrink-0">
              <h2 className="font-bold">{editing ? 'Edit supplier' : 'Add supplier'}</h2>
              <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="grid gap-4 p-5 overflow-y-auto flex-1 [scrollbar-width:thin] [scrollbar-color:#0f766e_#f1f5f9]">
              {[['supplier_name', 'Supplier name *', 'text'], ['phone', 'Phone', 'text'], ['address', 'Address', 'text']].map(([key, label]) => (
                <label key={key} className="text-sm font-semibold text-slate-700">
                  {label}
                  <input type="text" value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f766e] focus:bg-white" />
                </label>
              ))}
              {formErr && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formErr}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 p-5 shrink-0">
              <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => setModal(false)}>Cancel</button>
              <button className="rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-bold text-white hover:bg-[#115e59] disabled:opacity-60" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }) {
  return <div className="flex items-center justify-between rounded bg-slate-50 px-3 py-2 text-sm"><span className="text-slate-400">{label}</span><span className="font-semibold">{value}</span></div>;
}
function Spinner() { return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f766e]" /></div>; }
function ErrorBox({ msg }) { return <div className="rounded-lg bg-red-50 p-4 text-red-600"><p className="font-bold">Error</p><p className="text-sm">{msg}</p></div>; }

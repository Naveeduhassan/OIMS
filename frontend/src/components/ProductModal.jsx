import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { productAPI, categoryAPI, supplierAPI } from '../api';

export default function ProductModal({ open, onClose, product, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    image_url: '',
    price: '',
    stock: '',
    category_id: '',
    supplier_id: '',
    reorder_threshold: 10,
    reorder_quantity: 50,
  });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  // Load categories + suppliers once
  useEffect(() => {
    categoryAPI.getAll()
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => {});
    supplierAPI.getAll()
      .then((res) => setSuppliers(res.data?.data || []))
      .catch(() => {});
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        image_url: product.image_url || '',
        price: product.price ?? '',
        stock: product.stock ?? '',
        category_id: product.category_id ?? '',
        supplier_id: product.supplier_id ?? '',
        reorder_threshold: product.reorder_threshold ?? 10,
        reorder_quantity: product.reorder_quantity ?? 50,
      });
    } else {
      setForm({ name: '', description: '', image_url: '', price: '', stock: '', category_id: '', supplier_id: '', reorder_threshold: 10, reorder_quantity: 50 });
    }
    setError('');
  }, [product, open]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await productAPI.uploadImage(formData);
      // The backend returns { image_url: "/static/uploads/..." }
      // We need to prepend the backend host to make it absolute for the frontend if needed,
      // But actually, we can just save the relative path or absolute URL.
      // Vite config proxies might not work for raw img tags, so we'll construct the full URL.
      // Let's use the API base URL to infer the host.
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const host = baseUrl.replace('/api', '');
      const fullUrl = `${host}${res.data.image_url}`;
      
      setForm((prev) => ({ ...prev, image_url: fullUrl }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.price || !form.category_id) {
      setError('Name, price, and category are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        image_url: form.image_url,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10) || 0,
        category_id: parseInt(form.category_id, 10),
        supplier_id: form.supplier_id ? parseInt(form.supplier_id, 10) : null,
        reorder_threshold: parseInt(form.reorder_threshold, 10) || 10,
        reorder_quantity: parseInt(form.reorder_quantity, 10) || 50,
      };
      if (product?.id) {
        await productAPI.update(product.id, payload);
      } else {
        await productAPI.create(payload);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Admin access required to manage products.');
      } else {
        setError(err.response?.data?.error || 'Failed to save product.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-2xl flex flex-col my-auto" style={{maxHeight: 'calc(100vh - 2rem)'}}>
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <p className="text-sm font-semibold text-[#0f766e]">Product setup</p>
            <h2 className="mt-1 text-xl font-bold">{product ? 'Edit product' : 'Add product'}</h2>
          </div>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form className="grid gap-4 p-5 md:grid-cols-2 overflow-y-auto flex-1
          [scrollbar-width:thin] [scrollbar-color:#0f766e_#f1f5f9]
          " onSubmit={handleSubmit}>
          <label className="col-span-2 text-sm font-semibold text-slate-700">
            Product name *
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f766e] focus:bg-white focus:ring-4 focus:ring-teal-600/10"
            />
          </label>

          <label className="col-span-2 text-sm font-semibold text-slate-700">
            Description
            <textarea
              name="description"
              rows={2}
              value={form.description}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#0f766e] focus:bg-white focus:ring-4 focus:ring-teal-600/10"
            />
          </label>

          <div className="col-span-2">
            <label className="text-sm font-semibold text-slate-700">Product Image (Upload or URL)</label>
            <div className="mt-2 flex items-center gap-4">
              {form.image_url ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
                  <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                    className="absolute -top-1 -right-1 rounded-full bg-white p-0.5 text-rose-500 shadow hover:bg-rose-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                  <span className="text-xs">No img</span>
                </div>
              )}
              
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploadingImage}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-[#0f766e]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0f766e] hover:file:bg-[#0f766e]/20"
                />
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>OR</span>
                  <input
                    name="image_url"
                    type="url"
                    placeholder="Paste URL (https://...)"
                    value={form.image_url}
                    onChange={handleChange}
                    disabled={uploadingImage}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0f766e]"
                  />
                </div>
              </div>
            </div>
          </div>

          <label className="text-sm font-semibold text-slate-700">
            Category *
            <select
              name="category_id"
              required
              value={form.category_id}
              onChange={handleChange}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f766e] focus:bg-white focus:ring-4 focus:ring-teal-600/10"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.category_name}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Supplier (for Auto-PO)
            <select
              name="supplier_id"
              value={form.supplier_id}
              onChange={handleChange}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f766e] focus:bg-white focus:ring-4 focus:ring-teal-600/10"
            >
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.supplier_name}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Price *
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.price}
              onChange={handleChange}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f766e] focus:bg-white focus:ring-4 focus:ring-teal-600/10"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Initial stock
            <input
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f766e] focus:bg-white focus:ring-4 focus:ring-teal-600/10"
            />
          </label>

          <div className="col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Auto-Reorder Settings</p>
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
              <label className="text-sm font-semibold text-slate-700">
                Reorder Threshold
                <input
                  name="reorder_threshold"
                  type="number"
                  min="0"
                  value={form.reorder_threshold}
                  onChange={handleChange}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0f766e]"
                />
                <p className="mt-1 text-xs text-slate-400">Auto-PO fires when stock drops to this</p>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Reorder Quantity
                <input
                  name="reorder_quantity"
                  type="number"
                  min="1"
                  value={form.reorder_quantity}
                  onChange={handleChange}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0f766e]"
                />
                <p className="mt-1 text-xs text-slate-400">Units to order automatically</p>
              </label>
            </div>
          </div>

          {error && (
            <p className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </form>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end shrink-0">
          <button
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#115e59] disabled:opacity-60"
            onClick={handleSubmit}
            disabled={saving}
            type="submit"
          >
            {saving ? 'Saving…' : product ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </div>
    </div>
  );
}

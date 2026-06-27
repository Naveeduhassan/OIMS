import React, { useState } from 'react';
import { authAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut } from 'lucide-react';

export default function UserSettingsPage() {
  const { user, logout } = useAuth();
  const [form, setForm]   = useState({ full_name: user?.full_name || '', email: user?.email || '', password: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]     = useState('');
  const [err, setErr]     = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(''); setErr('');
    try {
      const payload = {};
      if (form.full_name) payload.full_name = form.full_name;
      if (form.email)     payload.email     = form.email;
      if (form.password)  payload.password  = form.password;
      await authAPI.updateProfile(payload);
      setMsg('Profile updated successfully.');
      setForm((p) => ({ ...p, password: '' }));
    } catch (error) { setErr(error.response?.data?.error || 'Failed to update profile.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* Profile form */}
      <section className="surface rounded-lg p-5">
        <h2 className="font-bold">Profile settings</h2>
        <p className="mt-1 text-sm text-slate-500">Update your name, email, or password.</p>
        <form className="mt-5 grid gap-4" onSubmit={handleSave}>
          <label className="text-sm font-semibold text-slate-700">
            Full name
            <input type="text" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f766e] focus:bg-white" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Email
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f766e] focus:bg-white" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            New password
            <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Leave blank to keep current" className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f766e] focus:bg-white" />
          </label>
          {msg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p>}
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
          <button type="submit" disabled={saving} className="rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#115e59] disabled:opacity-60">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      {/* Account info */}
      <section className="surface rounded-lg p-5">
        <h2 className="font-bold">Account info</h2>
        <p className="mt-1 text-sm text-slate-500">Your current session details.</p>
        <div className="mt-5 space-y-2">
          {[['Name', user?.full_name], ['Email', user?.email], ['Role', user?.role]].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="text-sm font-semibold capitalize">{value || '—'}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-center gap-2">
          <User size={15} className="text-slate-500" />
          <p className="text-sm text-slate-600">Logged in as <span className="font-bold">Customer</span></p>
        </div>
        <button className="mt-4 w-full rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-2" onClick={logout}>
          <LogOut size={15} /> Sign out
        </button>
      </section>
    </div>
  );
}

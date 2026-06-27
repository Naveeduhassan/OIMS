import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAdminAPI } from '../../api';
import {
  Users, ShieldCheck, User, Plus, Edit3,
  Trash2, X, Eye, EyeOff, CheckCircle2, XCircle,
} from 'lucide-react';

const EMPTY_FORM = { full_name: '', email: '', password: '', role: 'user', is_active: true };

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [toast, setToast]       = useState('');
  const [toastErr, setToastErr] = useState('');

  // Modal state
  const [modal, setModal]       = useState(false);   // 'create' | 'edit' | false
  const [editing, setEditing]   = useState(null);    // user object being edited
  const [form, setForm]         = useState(EMPTY_FORM);
  const [showPw, setShowPw]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [formErr, setFormErr]   = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const showToast = (msg, isErr = false) => {
    if (isErr) { setToastErr(msg); setTimeout(() => setToastErr(''), 4000); }
    else        { setToast(msg);    setTimeout(() => setToast(''), 3000); }
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await userAdminAPI.getAll();
      setUsers(res.data?.data || []);
    } catch (err) {
      setError(err.response?.status === 403 ? '403' : 'Failed to load users');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Open modals ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErr('');
    setShowPw(false);
    setModal('create');
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ full_name: u.full_name, email: u.email, password: '', role: u.role, is_active: u.is_active ?? true });
    setFormErr('');
    setShowPw(false);
    setModal('edit');
  };

  // ── Save (create or update) ────────────────────────────────────────────────
  const handleSave = async () => {
    setFormErr('');
    if (!form.full_name.trim()) { setFormErr('Full name is required.'); return; }
    if (!form.email.trim())     { setFormErr('Email is required.'); return; }
    if (modal === 'create' && !form.password) { setFormErr('Password is required for new users.'); return; }

    setSaving(true);
    try {
      if (modal === 'create') {
        await userAdminAPI.create(form);
        showToast(`User "${form.full_name}" created successfully.`);
      } else {
        const payload = { full_name: form.full_name, email: form.email, role: form.role, is_active: form.is_active };
        if (form.password) payload.password = form.password;
        await userAdminAPI.update(editing.id, payload);
        showToast(`User "${form.full_name}" updated successfully.`);
      }
      setModal(false);
      fetchUsers();
    } catch (err) {
      setFormErr(err.response?.data?.error || 'Failed to save user.');
    } finally { setSaving(false); }
  };

  // ── Quick role toggle ──────────────────────────────────────────────────────
  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await userAdminAPI.changeRole(u.id, newRole);
      showToast(`${u.full_name} is now ${newRole}.`);
      fetchUsers();
    } catch (err) { showToast(err.response?.data?.error || 'Failed to change role.', true); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userAdminAPI.delete(deleteTarget.id);
      showToast(`User "${deleteTarget.full_name}" deleted.`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete user.', true);
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <Spinner />;
  if (error === '403') return <PermBox />;
  if (error)   return <ErrBox msg={error} />;

  const admins  = users.filter((u) => u.role === 'admin');
  const regular = users.filter((u) => u.role === 'user');

  return (
    <div className="grid gap-5">
      {/* Toast notifications */}
      {toast    && <Toast msg={toast}    icon={<CheckCircle2 size={16} className="text-emerald-600" />} bg="bg-emerald-50 border-emerald-200 text-emerald-800" onClose={() => setToast('')} />}
      {toastErr && <Toast msg={toastErr} icon={<XCircle     size={16} className="text-red-500" />}     bg="bg-red-50 border-red-200 text-red-700"             onClose={() => setToastErr('')} />}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">{users.length} registered user{users.length !== 1 ? 's' : ''} — {admins.length} admin{admins.length !== 1 ? 's' : ''}, {regular.length} customer{regular.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#115e59]"
          onClick={openCreate}
        >
          <Plus size={16} /> Add user
        </button>
      </div>

      {/* Desktop table */}
      <div className="surface rounded-lg overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse bg-white text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`grid size-8 place-items-center rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-[#e8f5f3] text-[#0f766e]' : 'bg-slate-100 text-slate-600'}`}>
                        {u.full_name?.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-semibold">{u.full_name}</span>
                      {u.id === me?.id && <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">You</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${u.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.is_active !== false ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        title="Edit user"
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                        onClick={() => openEdit(u)}
                      >
                        <Edit3 size={14} />
                      </button>
                      {u.id !== me?.id && (
                        <>
                          <button
                            title={`Make ${u.role === 'admin' ? 'user' : 'admin'}`}
                            className={`rounded-lg border p-1.5 text-xs font-bold ${u.role === 'admin' ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-[#0f766e]/30 text-[#0f766e] hover:bg-[#e8f5f3]'}`}
                            onClick={() => toggleRole(u)}
                          >
                            {u.role === 'admin' ? <User size={14} /> : <ShieldCheck size={14} />}
                          </button>
                          <button
                            title="Delete user"
                            className="rounded-lg border border-rose-200 p-1.5 text-rose-500 hover:bg-rose-50"
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-400">No users found.</div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="grid gap-3 p-4 lg:hidden">
          {users.map((u) => (
            <div key={u.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${u.role === 'admin' ? 'bg-[#e8f5f3] text-[#0f766e]' : 'bg-slate-100 text-slate-600'}`}>
                    {u.full_name?.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{u.full_name} {u.id === me?.id && <span className="text-xs text-blue-500">(You)</span>}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                </div>
                <RoleBadge role={u.role} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50" onClick={() => openEdit(u)}>
                  Edit
                </button>
                {u.id !== me?.id && (
                  <>
                    <button className="flex-1 rounded-lg border border-[#0f766e]/30 py-1.5 text-xs font-bold text-[#0f766e] hover:bg-[#e8f5f3]" onClick={() => toggleRole(u)}>
                      Make {u.role === 'admin' ? 'user' : 'admin'}
                    </button>
                    <button className="flex-1 rounded-lg border border-rose-200 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50" onClick={() => setDeleteTarget(u)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl flex flex-col my-auto" style={{maxHeight: 'calc(100vh - 2rem)'}}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#0f766e]">
                  {modal === 'create' ? 'New user' : 'Edit user'}
                </p>
                <h2 className="mt-0.5 text-lg font-bold">
                  {modal === 'create' ? 'Create account' : editing?.full_name}
                </h2>
              </div>
              <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" onClick={() => setModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 overflow-y-auto flex-1 [scrollbar-width:thin] [scrollbar-color:#0f766e_#f1f5f9]">
              {/* Full name */}
              <label className="text-sm font-semibold text-slate-700">
                Full name *
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f766e] focus:bg-white"
                  placeholder="e.g. Ahmed Khan"
                />
              </label>

              {/* Email */}
              <label className="text-sm font-semibold text-slate-700">
                Email *
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f766e] focus:bg-white"
                  placeholder="user@example.com"
                />
              </label>

              {/* Password */}
              <label className="text-sm font-semibold text-slate-700">
                {modal === 'create' ? 'Password *' : 'New password'}
                <div className="relative mt-1.5">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-sm outline-none focus:border-[#0f766e] focus:bg-white"
                    placeholder={modal === 'edit' ? 'Leave blank to keep current' : 'Min. 6 characters'}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPw((v) => !v)}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>

              {/* Role + Status row */}
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold text-slate-700">
                  Role
                  <select
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    disabled={modal === 'edit' && editing?.id === me?.id}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f766e] disabled:opacity-50"
                  >
                    <option value="user">Customer</option>
                    <option value="staff">Staff (limited)</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  Status
                  <select
                    value={form.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === 'active' }))}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0f766e]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>

              {formErr && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formErr}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 shrink-0">
              <button
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[#0f766e] px-5 py-2 text-sm font-bold text-white hover:bg-[#115e59] disabled:opacity-60"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : modal === 'create' ? 'Create user' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="grid size-12 place-items-center rounded-full bg-rose-100 text-rose-600 mx-auto">
                <Trash2 size={22} />
              </div>
              <h2 className="mt-4 text-center text-lg font-bold">Delete user?</h2>
              <p className="mt-2 text-center text-sm text-slate-500">
                This will permanently delete <span className="font-bold">{deleteTarget.full_name}</span> ({deleteTarget.email}).
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
              <button
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${role === 'admin' ? 'bg-[#e8f5f3] text-[#0f766e]' : 'bg-slate-100 text-slate-600'}`}>
      {role === 'admin' ? <ShieldCheck size={11} /> : <User size={11} />}
      {role === 'admin' ? 'Admin' : 'Customer'}
    </span>
  );
}

function Toast({ msg, icon, bg, onClose }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${bg}`}>
      {icon}
      <p className="flex-1 text-sm font-semibold">{msg}</p>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

function PermBox() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <p className="font-bold text-amber-900">Admin access required</p>
      <p className="mt-1 text-sm text-amber-700">Only admins can manage users.</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f766e]" />
    </div>
  );
}

function ErrBox({ msg }) {
  return (
    <div className="rounded-lg bg-red-50 p-4 text-red-600">
      <p className="font-bold">Error</p>
      <p className="text-sm">{msg}</p>
    </div>
  );
}

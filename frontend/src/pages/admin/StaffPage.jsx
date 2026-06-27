import React, { useState, useEffect, useCallback } from 'react';
import { userAdminAPI, permissionAPI } from '../../api';
import { ShieldCheck, User, X, CheckCircle2, XCircle, Save } from 'lucide-react';

const PERMISSION_GROUPS = {
  'Products':     ['products.view', 'products.create', 'products.edit', 'products.delete'],
  'Orders':       ['orders.view', 'orders.update_status', 'orders.cancel'],
  'Stock':        ['stock.adjust', 'stock.history'],
  'Categories':   ['categories.view', 'categories.create', 'categories.edit', 'categories.delete'],
  'Suppliers':    ['suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete'],
  'Reports':      ['reports.view'],
  'Users':        ['users.view', 'users.edit'],
};

export default function StaffPage() {
  const [users, setUsers]           = useState([]);
  const [perms, setPerms]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [granted, setGranted]       = useState([]);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState('');
  const [toastErr, setToastErr]     = useState('');

  const showToast = (msg, isErr = false) => {
    if (isErr) { setToastErr(msg); setTimeout(() => setToastErr(''), 4000); }
    else        { setToast(msg);    setTimeout(() => setToast(''), 3000); }
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, pRes] = await Promise.all([
        userAdminAPI.getAll(),
        permissionAPI.getAll(),
      ]);
      setUsers(uRes.data?.data || []);
      setPerms(pRes.data?.data || []);
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectUser = async (u) => {
    setSelected(u);
    setGranted([]);
    try {
      const res = await userAdminAPI.getPermissions(u.id);
      setGranted(res.data?.data || []);
    } catch { showToast('Failed to load permissions', true); }
  };

  const togglePerm = (slug) => {
    setGranted((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleGroup = (groupSlugs, enable) => {
    setGranted((prev) => {
      const set = new Set(enable ? [...prev, ...groupSlugs] : prev.filter((s) => !groupSlugs.includes(s)));
      return [...set];
    });
  };

  const savePermissions = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await userAdminAPI.setPermissions(selected.id, granted);
      showToast(`Permissions updated for ${selected.full_name}`);
    } catch (err) { showToast(err.response?.data?.error || 'Failed to save permissions', true); }
    finally { setSaving(false); }
  };

  const allSlugs = Object.values(PERMISSION_GROUPS).flat();

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox msg={error} />;

  const staffList = users.filter((u) => u.role === 'staff');
  const adminList = users.filter((u) => u.role === 'admin');

  return (
    <div className="grid gap-5">
      {toast    && <Toast msg={toast}    icon={<CheckCircle2 size={16} className="text-emerald-600" />} bg="bg-emerald-50 border-emerald-200 text-emerald-800" onClose={() => setToast('')} />}
      {toastErr && <Toast msg={toastErr} icon={<XCircle     size={16} className="text-red-500" />}     bg="bg-red-50 border-red-200 text-red-700"             onClose={() => setToastErr('')} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold">Staff management</h2>
          <p className="text-sm text-slate-500">{staffList.length} staff members — grant granular permissions</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_2fr]">
        {/* Staff list */}
        <div className="surface rounded-lg p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Staff members</h3>
          {staffList.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No staff created yet.<br/>Create staff users from the Users page.</p>
          ) : (
            <div className="space-y-1">
              {staffList.map((u) => (
                <button
                  key={u.id}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${selected?.id === u.id ? 'bg-[#e8f5f3] border border-[#0f766e]/30' : 'hover:bg-slate-50 border border-transparent'}`}
                  onClick={() => selectUser(u)}
                >
                  <span className="grid size-8 place-items-center rounded-full bg-amber-50 text-amber-600 text-xs font-bold">{u.full_name?.charAt(0).toUpperCase()}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{u.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-6 mb-3">Admins</h3>
          <div className="space-y-1">
            {adminList.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg p-3">
                <span className="grid size-8 place-items-center rounded-full bg-[#e8f5f3] text-[#0f766e] text-xs font-bold">{u.full_name?.charAt(0).toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{u.full_name} <span className="text-xs font-normal text-[#0f766e]">(full access)</span></p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permission toggles */}
        <div className="surface rounded-lg p-4">
          {!selected ? (
            <div className="py-16 text-center">
              <ShieldCheck className="mx-auto text-slate-300" size={40} />
              <p className="mt-3 font-bold text-slate-500">Select a staff member</p>
              <p className="mt-1 text-sm text-slate-400">Choose a user from the left panel to manage their permissions.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold">{selected.full_name}</h3>
                  <p className="text-xs text-slate-500">{selected.email}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Staff</span>
              </div>

              <div className="space-y-4">
                {Object.entries(PERMISSION_GROUPS).map(([group, slugs]) => {
                  const groupGranted = slugs.every((s) => granted.includes(s));
                  const someGranted  = slugs.some((s) => granted.includes(s));
                  return (
                    <div key={group}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{group}</p>
                        <button
                          className="text-[10px] font-semibold text-[#0f766e] hover:underline"
                          onClick={() => toggleGroup(slugs, !groupGranted)}
                        >
                          {groupGranted ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {slugs.map((slug) => {
                          const perm = perms.find((p) => p.slug === slug);
                          const on = granted.includes(slug);
                          return (
                            <button
                              key={slug}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${on ? 'bg-[#e8f5f3] border-[#0f766e] text-[#0f766e]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                              onClick={() => togglePerm(slug)}
                            >
                              {perm?.description || slug}
                              {on && <X size={12} />}
                            </button>
                          );
                        })}
                      </div>
                      {someGranted && !groupGranted && (
                        <div className="mt-1 h-0.5 rounded-full bg-gradient-to-r from-[#0f766e]/40 to-transparent" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500">{granted.length} of {allSlugs.length} permissions granted</p>
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#115e59] disabled:opacity-60"
                  onClick={savePermissions}
                  disabled={saving}
                >
                  <Save size={15} /> {saving ? 'Saving…' : 'Save permissions'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() { return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0f766e]" /></div>; }
function ErrorBox({ msg }) { return <div className="rounded-lg bg-red-50 p-4 text-red-600"><p className="font-bold">Error</p><p className="text-sm">{msg}</p></div>; }
function Toast({ msg, icon, bg, onClose }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${bg}`}>
      {icon}
      <p className="flex-1 text-sm font-semibold">{msg}</p>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

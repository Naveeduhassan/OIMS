import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Plus, LogOut, User, ChevronDown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminTopbar({ onMenu, query, setQuery, onAdd }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden" onClick={onMenu} aria-label="Menu">
          <Menu size={18} />
        </button>

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-[#0f766e] focus:bg-white focus:ring-4 focus:ring-teal-600/10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
          />
        </div>

        <button
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f766e] px-3 py-2 text-sm font-bold text-white hover:bg-[#115e59]"
          onClick={onAdd}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Product</span>
        </button>

        <div className="relative" ref={ref}>
          <button
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="grid size-6 place-items-center rounded-full bg-[#e8f5f3] text-[#0f766e]">
              <ShieldCheck size={13} />
            </span>
            <span className="hidden max-w-[100px] truncate sm:block">{user?.full_name || 'Admin'}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-bold">{user?.full_name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
                <span className="mt-1 inline-block rounded-full bg-[#e8f5f3] px-2 py-0.5 text-[10px] font-bold uppercase text-[#0f766e]">Admin</span>
              </div>
              <div className="p-1">
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50" onClick={() => { setOpen(false); navigate('/admin/settings'); }}>
                  <User size={14} /> Settings
                </button>
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50" onClick={handleLogout}>
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

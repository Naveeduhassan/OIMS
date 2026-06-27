import React, { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserTopbar({ onMenu }) {
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
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden" onClick={onMenu}>
          <Menu size={18} />
        </button>

        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-700">
            Welcome back, <span className="text-[#0f766e]">{user?.full_name?.split(' ')[0] || 'there'}</span>
          </p>
        </div>

        <div className="relative" ref={ref}>
          <button
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="grid size-6 place-items-center rounded-full bg-slate-100 text-slate-600">
              <User size={13} />
            </span>
            <span className="hidden max-w-[100px] truncate sm:block">{user?.full_name || 'Account'}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-bold">{user?.full_name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
                <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">Customer</span>
              </div>
              <div className="p-1">
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50" onClick={() => { setOpen(false); navigate('/portal/settings'); }}>
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

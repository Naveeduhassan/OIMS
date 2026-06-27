import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, ClipboardList, Settings, PackageCheck, X, Home } from 'lucide-react';

const navItems = [
  { id: '',         label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products',  icon: ShoppingBag },
  { id: 'orders',   label: 'My Orders', icon: ClipboardList },
  { id: 'settings', label: 'Settings',  icon: Settings },
  { id: 'home',     label: 'Back to Store', icon: Home, link: '/' },
];

export default function UserSidebar({ activeView, open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (id, link) => {
    if (link) {
      navigate(link);
    } else {
      navigate(id === '' ? '/portal' : `/portal/${id}`);
    }
    if (open) onClose();
  };

  const isActive = (id) =>
    id === ''
      ? location.pathname === '/portal' || location.pathname === '/portal/'
      : id !== 'home' && location.pathname === `/portal/${id}`;

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-950/35 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <button className="flex items-center gap-3" onClick={() => go('')}>
            <span className="grid size-9 place-items-center rounded-lg bg-[#0f766e] text-white">
              <PackageCheck size={18} />
            </span>
            <span>
              <span className="block text-sm font-bold">SOIMS</span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">Customer Portal</span>
            </span>
          </button>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {navItems.map(({ id, label, icon: Icon, link }) => {
            const active = isActive(id);
            return (
              <button
                key={id}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-[#e8f5f3] text-[#0f766e]' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => go(id, link)}
              >
                <Icon size={17} />
                {label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Boxes, ClipboardList, BarChart3, Users } from 'lucide-react';

const items = [
  { id: '',         label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory',label: 'Inventory', icon: Boxes },
  { id: 'orders',   label: 'Orders',    icon: ClipboardList },
  { id: 'reports',  label: 'Reports',   icon: BarChart3 },
  { id: 'users',    label: 'Users',     icon: Users },
];

export default function AdminMobileNav({ activeView }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white lg:hidden">
      {items.map(({ id, label, icon: Icon }) => {
        const active = id === ''
          ? location.pathname === '/admin' || location.pathname === '/admin/'
          : location.pathname === `/admin/${id}`;
        return (
          <button
            key={id}
            className={`flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[10px] font-bold ${active ? 'text-[#0f766e]' : 'text-slate-500'}`}
            onClick={() => navigate(id === '' ? '/admin' : `/admin/${id}`)}
          >
            <Icon size={18} />
            <span className="w-full truncate text-center">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

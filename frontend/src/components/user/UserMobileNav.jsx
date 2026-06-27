import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, ClipboardList, Settings } from 'lucide-react';

const items = [
  { id: '',         label: 'Home',     icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'orders',   label: 'Orders',   icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function UserMobileNav({ activeView }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white lg:hidden">
      {items.map(({ id, label, icon: Icon }) => {
        const active = id === ''
          ? location.pathname === '/portal' || location.pathname === '/portal/'
          : location.pathname === `/portal/${id}`;
        return (
          <button
            key={id}
            className={`flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[10px] font-bold ${active ? 'text-[#0f766e]' : 'text-slate-500'}`}
            onClick={() => navigate(id === '' ? '/portal' : `/portal/${id}`)}
          >
            <Icon size={18} />
            <span className="w-full truncate text-center">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

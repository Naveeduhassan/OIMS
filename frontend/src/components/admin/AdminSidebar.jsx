import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Boxes, ArrowDownUp, AlertTriangle,
  ClipboardList, Truck, BarChart3, Settings, PackageCheck,
  X, Users, ShieldCheck, History, Receipt
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { productAPI, userAdminAPI } from '../../api';

const navItems = [
  { id: '',          label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory',      icon: Boxes },
  { id: 'movements', label: 'Movements',      icon: ArrowDownUp },
  { id: 'reorder',   label: 'Low Stock',      icon: AlertTriangle },
  { id: 'orders',    label: 'Orders',         icon: ClipboardList },
  { id: 'transactions', label: 'Transactions',icon: Receipt },
  { id: 'suppliers', label: 'Suppliers',      icon: Truck },
  { id: 'reports',   label: 'Reports',        icon: BarChart3 },
  { id: 'users',     label: 'Users',          icon: Users },
  { id: 'staff',     label: 'Staff',          icon: ShieldCheck },
  { id: 'audit-logs',label: 'Audit Logs',     icon: History },
  { id: 'settings',  label: 'Settings',       icon: Settings },
];

export default function AdminSidebar({ activeView, open, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [staffPerms, setStaffPerms] = useState([]);

  useEffect(() => {
    productAPI.getAll()
      .then((res) => setLowStockCount((res.data?.data || []).filter((p) => p.stock <= 10).length))
      .catch(() => {});
    if (user?.role === 'staff') {
      userAdminAPI.getPermissions(user.id)
        .then((res) => setStaffPerms(res.data?.data || []))
        .catch(() => {});
    }
  }, [user]);

  const hasPerm = (slug) => user?.role === 'admin' || staffPerms.includes(slug);

  const visibleItems = navItems.filter((item) => {
    if (user?.role === 'admin') return true;
    if (item.id === '') return true; // dashboard always visible
    if (item.id === 'reorder') return hasPerm('products.view') || hasPerm('inventory.manage');
    if (item.id === 'inventory') return hasPerm('products.view');
    if (item.id === 'movements') return hasPerm('inventory.manage');
    if (item.id === 'orders') return hasPerm('orders.manage');
    if (item.id === 'suppliers') return hasPerm('suppliers.manage');
    if (item.id === 'reports') return hasPerm('reports.view');
    if (item.id === 'users') return hasPerm('users.manage');
    if (item.id === 'staff') return false; // only admin
    if (item.id === 'audit-logs') return false; // only admin
    if (item.id === 'settings') return false; // only admin
    return true;
  });

  const go = (id) => {
    navigate(id === '' ? '/admin' : `/admin/${id}`);
    if (open) onClose();
  };

  const isActive = (id) =>
    id === ''
      ? location.pathname === '/admin' || location.pathname === '/admin/'
      : location.pathname === `/admin/${id}`;

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-950/35 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
          <button className="flex items-center gap-3" onClick={() => go('')}>
            <span className="grid size-9 place-items-center rounded-lg bg-[#0f766e] text-white">
              <PackageCheck size={18} />
            </span>
            <span>
              <span className="block text-sm font-bold">SOIMS</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-[#0f766e]">
                <ShieldCheck size={10} /> Admin Panel
              </span>
            </span>
          </button>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <button
                key={item.id}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-[#e8f5f3] text-[#0f766e]' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => go(item.id)}
              >
                <Icon size={17} />
                {item.label}
                {item.id === 'reorder' && lowStockCount > 0 && (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{lowStockCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {lowStockCount > 0 && (
          <div className="m-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-bold text-amber-900">{lowStockCount} item{lowStockCount !== 1 ? 's' : ''} need reorder</p>
            <p className="mt-0.5 text-xs text-amber-700">Review before stock runs out.</p>
          </div>
        )}
      </aside>
    </>
  );
}

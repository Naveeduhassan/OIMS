import React from 'react';
import { ShieldCheck } from 'lucide-react';

const labels = {
  '':          ['Admin Dashboard',    'Full system overview — inventory, orders, users, and analytics.'],
  inventory:   ['Inventory',          'Manage all products with full CRUD operations.'],
  movements:   ['Stock Movements',    'Complete audit trail of every stock change.'],
  reorder:     ['Low Stock Alerts',   'Products below threshold that need immediate reorder.'],
  orders:      ['All Orders',         'View and manage every order across all customers.'],
  suppliers:   ['Suppliers',          'Manage supplier records, contacts, and addresses.'],
  reports:     ['Reports & Analytics','Business insights — revenue, top products, category performance.'],
  users:       ['User Management',    'View all users and manage role-based access control.'],
  settings:    ['Settings',           'Update your admin profile and account preferences.'],
};

export default function AdminHeader({ activeView }) {
  const [title, desc] = labels[activeView] || labels[''];
  return (
    <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#0f766e]">
          <ShieldCheck size={13} /> Admin Panel
        </p>
        <h1 className="mt-1.5 text-2xl font-bold text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{desc}</p>
      </div>
    </section>
  );
}

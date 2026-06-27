import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingBag size={24} className="text-[#0f766e]" />
          <span className="text-xl font-bold text-slate-800">YourStore</span>
        </div>
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} YourStore Inc. All rights reserved.
        </p>
        <nav className="flex gap-4 text-sm text-slate-600">
          <Link to="/" className="hover:text-[#0f766e] transition-colors">Home</Link>
          <Link to="/products" className="hover:text-[#0f766e] transition-colors">Shop</Link>
          <Link to="/categories" className="hover:text-[#0f766e] transition-colors">Categories</Link>
        </nav>
      </div>
    </footer>
  );
}

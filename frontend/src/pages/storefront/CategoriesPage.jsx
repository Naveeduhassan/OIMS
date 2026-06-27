// src/pages/storefront/CategoriesPage.jsx
import React, { useEffect, useState } from 'react';
import { categoryAPI } from '../../api';
import { Link } from 'react-router-dom';
import { Tag, ChevronRight, Package } from 'lucide-react';

const COLORS = [
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-blue-500 to-indigo-600',
  'from-green-500 to-emerald-600',
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await categoryAPI.getAll();
        // Backend may return {data: [...]} or just an array
        setCategories(Array.isArray(data) ? data : (data.data || []));
      } catch (err) {
        console.error('Failed to fetch categories', err);
        setError('Unable to load categories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="h-8 w-48 rounded-lg bg-slate-200 animate-pulse mb-2" />
          <div className="h-4 w-72 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-center px-4">
        <div>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-rose-50">
            <Tag size={28} className="text-rose-400" />
          </div>
          <p className="text-lg font-semibold text-slate-800">Something went wrong</p>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-[#0f766e] px-6 py-2 text-sm font-bold text-white hover:bg-[#115e59] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#0f766e]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#0f766e] mb-3">
          <Tag size={12} />
          Browse by Category
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Shop by Category
        </h1>
        <p className="mt-2 text-slate-500">
          Discover our wide range of product categories — find exactly what you're looking for.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-slate-100">
            <Package size={36} className="text-slate-400" />
          </div>
          <p className="text-xl font-semibold text-slate-700">No Categories Yet</p>
          <p className="mt-1 text-slate-500 text-sm">Check back soon — we're adding new categories.</p>
          <Link
            to="/products"
            className="mt-6 rounded-full bg-[#0f766e] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#115e59] transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <li key={cat.id}>
              <Link
                to={`/products?category=${cat.id}`}
                className="group flex flex-col justify-between h-full rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Color bar */}
                <div className={`h-2 w-full bg-gradient-to-r ${COLORS[i % COLORS.length]}`} />
                <div className="p-6 flex-1">
                  <div className={`mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${COLORS[i % COLORS.length]} text-white shadow-md`}>
                    <Tag size={22} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 group-hover:text-[#0f766e] transition-colors mb-1">
                    {cat.category_name || cat.name}
                  </h2>
                  {cat.description && (
                    <p className="text-sm text-slate-500 line-clamp-2">{cat.description}</p>
                  )}
                </div>
                <div className="px-6 pb-5 flex items-center gap-1 text-sm font-semibold text-[#0f766e] group-hover:gap-2 transition-all">
                  View Products <ChevronRight size={16} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

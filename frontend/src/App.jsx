import { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Auth pages
import Login    from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/storefront/HomePage';
import ProductsPage from './pages/storefront/ProductsPage';
import CategoriesPage from './pages/storefront/CategoriesPage';

import CheckoutPage from './pages/storefront/CheckoutPage';

// Shared guard
import ProtectedRoute from './components/ProtectedRoute';
import StorefrontLayout from './components/storefront/StorefrontLayout';

// Admin pages
import DashboardPage  from './pages/admin/DashboardPage';
import InventoryPage  from './pages/admin/InventoryPage';
import MovementsPage  from './pages/admin/MovementsPage';
import ReorderPage    from './pages/admin/ReorderPage';
import OrdersPage     from './pages/admin/OrdersPage';
import SuppliersPage  from './pages/admin/SuppliersPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import ReportsPage    from './pages/admin/ReportsPage';
import SettingsPage   from './pages/admin/SettingsPage';
import UsersPage      from './pages/admin/UsersPage';
import StaffPage      from './pages/admin/StaffPage';
import AuditLogsPage  from './pages/admin/AuditLogsPage';

// User pages
import UserDashboardPage from './pages/user/UserDashboardPage';
import UserOrdersPage    from './pages/user/UserOrdersPage';
import UserProductsPage  from './pages/user/UserProductsPage';
import UserSettingsPage  from './pages/user/UserSettingsPage';

// Global toast
import ToastContainer from './components/Toast';

// Admin layout components
import AdminSidebar from './components/admin/AdminSidebar';
import AdminTopbar  from './components/admin/AdminTopbar';
import AdminHeader  from './components/admin/AdminHeader';
import AdminMobileNav from './components/admin/AdminMobileNav';
import ProductDrawer from './components/ProductDrawer';
import ProductModal  from './components/ProductModal';

// User layout components
import UserSidebar   from './components/user/UserSidebar';
import UserTopbar    from './components/user/UserTopbar';
import UserMobileNav from './components/user/UserMobileNav';

// ── Role-based redirect ───────────────────────────────────────────────────────
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // admin and staff both go to the admin panel
  return <Navigate to={(user.role === 'admin' || user.role === 'staff') ? '/admin' : '/portal'} replace />;
}

// ── Admin guard (admin + staff) ────────────────────────────────────────────────
function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'staff') return <Navigate to="/portal" replace />;
  return <Outlet />;
}

// ── Strict Admin guard (admin only) ──────────────────────────────────────────
function StrictAdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/admin" replace />;
  return <Outlet />;
}

// ── User-only guard ───────────────────────────────────────────────────────────
function UserRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'staff' || user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Outlet />;
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0f766e]" />
    </div>
  );
}

// ── Inventory wrapper (passes outlet context down) ────────────────────────────
function InventoryWrapper() {
  const { openProduct, openModal, refreshKey } = useOutletContext();
  return <InventoryPage onViewProduct={openProduct} onAddProduct={() => openModal(null)} refreshKey={refreshKey} />;
}

// ── Admin layout ──────────────────────────────────────────────────────────────
function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery]             = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [refreshKey, setRefreshKey]   = useState(0);

  const currentPath = useLocation().pathname;
  const activeView  = currentPath.split('/')[2] || 'dashboard';

  const openProduct = useCallback((p) => { setSelectedProduct(p); setDrawerOpen(true); }, []);
  const openModal   = useCallback((p = null) => { setSelectedProduct(p); setModalOpen(true); }, []);
  const handleSaved = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className="flex min-h-screen">
        <AdminSidebar activeView={activeView} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 pb-24 lg:pb-0 lg:pl-72">
          <AdminTopbar onMenu={() => setSidebarOpen(true)} query={query} setQuery={setQuery} onAdd={() => openModal(null)} />
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 page-enter">
            <AdminHeader activeView={activeView} />
            <Outlet context={{ openProduct, openModal, refreshKey }} />
          </div>
        </main>
      </div>
      <AdminMobileNav activeView={activeView} />
      <ProductDrawer product={selectedProduct} open={drawerOpen} onClose={() => setDrawerOpen(false)} onEdit={() => { setDrawerOpen(false); openModal(selectedProduct); }} />
      <ProductModal open={modalOpen} onClose={() => setModalOpen(false)} product={selectedProduct} onSaved={handleSaved} />
    </div>
  );
}

// ── User layout ───────────────────────────────────────────────────────────────
function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentPath = useLocation().pathname;
  const activeView  = currentPath.split('/')[2] || 'dashboard';

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className="flex min-h-screen">
        <UserSidebar activeView={activeView} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 pb-24 lg:pb-0 lg:pl-64">
          <UserTopbar onMenu={() => setSidebarOpen(true)} />
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <UserMobileNav activeView={activeView} />
    </div>
  );
}

// ── Root router ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <><Routes>
      {/* Public */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Storefront public pages */}
      <Route element={<StorefrontLayout />}>
        <Route index element={<HomePage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
      </Route>

      {/* Root redirect based on role */}
      <Route element={<ProtectedRoute />}>
        <Route path="/"         element={<RoleRedirect />} />
        <Route path="/dashboard" element={<RoleRedirect />} />
      </Route>

      {/* Admin routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index                element={<DashboardPage />} />
          <Route path="inventory"     element={<InventoryWrapper />} />
          <Route path="movements"     element={<MovementsPage />} />
          <Route path="reorder"       element={<ReorderPage />} />
          <Route path="suppliers"     element={<SuppliersPage />} />
          
          <Route element={<StrictAdminRoute />}>
            <Route path="reports"       element={<ReportsPage />} />
            <Route path="orders"        element={<OrdersPage />} />
            <Route path="transactions"  element={<TransactionsPage />} />
            <Route path="users"         element={<UsersPage />} />
            <Route path="staff"         element={<StaffPage />} />
            <Route path="audit-logs"    element={<AuditLogsPage />} />
            <Route path="settings"      element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* User portal routes */}
      <Route element={<UserRoute />}>
        <Route path="/portal" element={<UserLayout />}>
          <Route index             element={<UserDashboardPage />} />
          <Route path="products"   element={<UserProductsPage />} />
          <Route path="orders"     element={<UserOrdersPage />} />
          <Route path="settings"   element={<UserSettingsPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ToastContainer />
  </>);
}

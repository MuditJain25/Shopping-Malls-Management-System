import { useState } from 'react';
import {
  ShoppingBag, Store, Building2, Users, Briefcase, User,
  LogOut, Menu, X, MapPin, Gavel, BarChart3, FileText, Package, Home, Clock, CalendarCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';

const NAV_CONFIG = {
  customer: [
    { label: 'Discover Malls', path: '/app/customer', icon: MapPin },
    { label: 'Explore Properties', path: '/app/customer/properties', icon: Building2 },
    { label: 'My Bids', path: '/app/customer/bids', icon: Gavel },
  ],
  tenant: [
    { label: 'Overview', path: '/app/tenant', icon: Home },
    { label: 'My Stores', path: '/app/tenant/stores', icon: Store },
    { label: 'Products', path: '/app/tenant/products', icon: Package },
    { label: 'Employees', path: '/app/tenant/employees', icon: Users },
    { label: 'Leave Requests', path: '/app/tenant/leave', icon: FileText },
    { label: 'Transactions', path: '/app/tenant/transactions', icon: BarChart3 },
    { label: 'Revenue Reports', path: '/app/tenant/revenue', icon: CalendarCheck },
  ],
  shop_manager: [
    { label: 'Overview', path: '/app/shop-manager', icon: Home },
    { label: 'My Store', path: '/app/shop-manager/store', icon: Store },
    { label: 'Products', path: '/app/shop-manager/products', icon: Package },
    { label: 'Employees', path: '/app/shop-manager/employees', icon: Users },
    { label: 'Leave Requests', path: '/app/shop-manager/leave', icon: FileText },
    { label: 'Transactions', path: '/app/shop-manager/transactions', icon: BarChart3 },
  ],
  mall_manager: [
    { label: 'Overview', path: '/app/mall-manager', icon: Home },
    { label: 'Employees', path: '/app/mall-manager/employees', icon: Users },
    { label: 'Stores', path: '/app/mall-manager/stores', icon: Store },
    { label: 'Tenants', path: '/app/mall-manager/tenants', icon: Building2 },
    { label: 'Agreements', path: '/app/mall-manager/agreements', icon: FileText },
    { label: 'Bidding Control', path: '/app/mall-manager/bidding', icon: Gavel },
  ],
  executive: [
    { label: 'Overview', path: '/app/executive', icon: Home },
    { label: 'Malls & Managers', path: '/app/executive/malls', icon: Building2 },
    { label: 'Tenants', path: '/app/executive/tenants', icon: Users },
    { label: 'Bid Events', path: '/app/executive/bids', icon: Gavel },
    { label: 'Analytics', path: '/app/executive/analytics', icon: BarChart3 },
    { label: 'Create Manager', path: '/app/executive/create-manager', icon: User },
  ],
  employee: [
    { label: 'Dashboard', path: '/app/employee', icon: Home },
    { label: 'Attendance', path: '/app/employee/attendance', icon: Clock },
    { label: 'Leave Requests', path: '/app/employee/leave', icon: FileText },
    { label: 'Salary Slips', path: '/app/employee/salary', icon: Briefcase },
    { label: 'Profile', path: '/app/employee/profile', icon: User },
  ],
};

const ROLE_LABELS = {
  customer: 'Customer',
  tenant: 'Tenant',
  shop_manager: 'Shop Manager',
  mall_manager: 'Mall Manager',
  executive: 'Executive',
  employee: 'Employee',
};

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { route, navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const navItems = NAV_CONFIG[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNav = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-60 bg-white border-r border-slate-200 z-40
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <h1 className="font-bold text-base text-slate-900">Shopping Malls Management System</h1>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = route === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
                  ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}
                `}
              >
                <Icon size={16} className={active ? 'text-brand-600' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-slate-200">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-slate-700">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-slate-400">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} className="text-slate-400" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 rounded text-slate-600 hover:bg-slate-100"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span className="text-sm font-medium text-slate-600">{ROLE_LABELS[user.role]} Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

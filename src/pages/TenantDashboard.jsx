import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';
import { LoadingSpinner } from '@/components/ui/index.jsx';
import {
  getStoresByTenant, getStoreById, stores,
} from '@/lib/mockData.js';

import Overview from './TenantDashboardComponents/Overview';
import StoresView from './TenantDashboardComponents/StoresView';
import ProductsView from './TenantDashboardComponents/ProductsView';
import EmployeesView from './TenantDashboardComponents/EmployeesView';
import LeaveView from './TenantDashboardComponents/LeaveView';
import TransactionsView from './TenantDashboardComponents/TransactionsView';
import RevenueView from './TenantDashboardComponents/RevenueView';

export default function TenantDashboard({ role = 'tenant' }) {
  const { user } = useAuth();
  const { route } = useRouter();

  if (!user) return <LoadingSpinner />;

  const isShopManager = role === 'shop_manager';
  const tenantId = isShopManager ? null : user.profileId;
  const allStores = isShopManager
    ? [getStoreById('s1')].filter(Boolean)
    : getStoresByTenant(tenantId);

  const shopManagerStore = isShopManager
    ? stores.find(s => s.store_id === 's1')
    : null;

  const activeStores = isShopManager ? [shopManagerStore].filter(Boolean) : allStores;

  const pageKey = route.split('/').pop() || (isShopManager ? 'shop-manager' : 'tenant');

  if (pageKey === (isShopManager ? 'shop-manager' : 'tenant') || pageKey === '') {
    return <Overview role={role} stores={activeStores} tenantId={tenantId} />;
  }
  if (pageKey === 'stores' || pageKey === 'store') {
    return <StoresView stores={activeStores} />;
  }
  if (pageKey === 'products') {
    return <ProductsView stores={activeStores} />;
  }
  if (pageKey === 'employees') {
    return <EmployeesView stores={activeStores} />;
  }
  if (pageKey === 'leave') {
    return <LeaveView stores={activeStores} />;
  }
  if (pageKey === 'transactions') {
    return <TransactionsView tenantId={tenantId} isShopManager={isShopManager} stores={activeStores} />;
  }
  if (pageKey === 'revenue') {
    return <RevenueView tenantId={tenantId} />;
  }
  return <Overview role={role} stores={activeStores} tenantId={tenantId} />;
}

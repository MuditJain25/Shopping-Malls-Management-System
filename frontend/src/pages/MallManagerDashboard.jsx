import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/index.jsx';
import { apiGetManagerById } from '@/lib/api.js';

import Overview from './MallManagerDashboardComponents/Overview';
import EmployeesView from './MallManagerDashboardComponents/EmployeesView';
import StoresView from './MallManagerDashboardComponents/StoresView';
import TenantsView from './MallManagerDashboardComponents/TenantsView';
import TransactionsView from './MallManagerDashboardComponents/TransactionsView';
import BiddingView from './MallManagerDashboardComponents/BiddingView';

export default function MallManagerDashboard() {
  const { user } = useAuth();
  const { route } = useRouter();
  const [manager, setManager] = useState(null);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setError(null);
    setLoaded(false);
    apiGetManagerById(user.profileId)
      .then(m => { if (!cancelled) { setManager(m); setLoaded(true); } })
      .catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (!loaded) return <LoadingSpinner label="Loading dashboard..." />;
  if (!manager) return <EmptyState title="Manager not found" message="No mall manager profile is linked to your account." />;

  const mallId = manager.mall_id;
  const pageKey = route.split('/').pop() || 'mall-manager';

  if (pageKey === 'mall-manager') return <Overview mallId={mallId} manager={manager} />;
  if (pageKey === 'employees') return <EmployeesView mallId={mallId} />;
  if (pageKey === 'stores') return <StoresView mallId={mallId} />;
  if (pageKey === 'tenants') return <TenantsView mallId={mallId} />;
  if (pageKey === 'transactions') return <TransactionsView mallId={mallId} />;
  if (pageKey === 'bidding') return <BiddingView mallId={mallId} />;
  return <Overview mallId={mallId} manager={manager} />;
}

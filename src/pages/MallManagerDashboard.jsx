import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';
import { LoadingSpinner } from '@/components/ui/index.jsx';
import { mallManagers } from '@/lib/mockData.js';

import Overview from './MallManagerDashboardComponents/Overview';
import EmployeesView from './MallManagerDashboardComponents/EmployeesView';
import StoresView from './MallManagerDashboardComponents/StoresView';
import TenantsView from './MallManagerDashboardComponents/TenantsView';
import AgreementsView from './MallManagerDashboardComponents/AgreementsView';
import BiddingView from './MallManagerDashboardComponents/BiddingView';

export default function MallManagerDashboard() {
  const { user } = useAuth();
  const { route } = useRouter();

  if (!user) return <LoadingSpinner />;

  const manager = mallManagers.find(mm => mm.manager_id === user.profileId);
  const mallId = manager?.mall_id || 'm1';
  const pageKey = route.split('/').pop() || 'mall-manager';

  if (pageKey === 'mall-manager') return <Overview mallId={mallId} manager={manager} />;
  if (pageKey === 'employees') return <EmployeesView mallId={mallId} />;
  if (pageKey === 'stores') return <StoresView mallId={mallId} />;
  if (pageKey === 'tenants') return <TenantsView mallId={mallId} />;
  if (pageKey === 'agreements') return <AgreementsView mallId={mallId} />;
  if (pageKey === 'bidding') return <BiddingView mallId={mallId} />;
  return <Overview mallId={mallId} manager={manager} />;
}

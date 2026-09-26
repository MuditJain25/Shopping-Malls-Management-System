import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';
import { LoadingSpinner } from '@/components/ui/index.jsx';

import Overview from './ExecutiveDashboardComponents/Overview';
import MallsView from './ExecutiveDashboardComponents/MallsView';
import TenantsView from './ExecutiveDashboardComponents/TenantsView';
import BidsView from './ExecutiveDashboardComponents/BidsView';
import AnalyticsView from './ExecutiveDashboardComponents/AnalyticsView';
import CreateManagerView from './ExecutiveDashboardComponents/CreateManagerView';

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const { route } = useRouter();
  if (!user) return <LoadingSpinner />;
  const pageKey = route.split('/').pop() || 'executive';

  if (pageKey === 'executive') return <Overview />;
  if (pageKey === 'malls') return <MallsView />;
  if (pageKey === 'tenants') return <TenantsView />;
  if (pageKey === 'bids') return <BidsView />;
  if (pageKey === 'analytics') return <AnalyticsView />;
  if (pageKey === 'create-manager') return <CreateManagerView />;
  return <Overview />;
}

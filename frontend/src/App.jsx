import { AuthProvider, useAuth } from '@/context/AuthContext.jsx';
import { RouterProvider, useRouter } from '@/context/RouterContext.jsx';
import AppShell from '@/components/AppShell.jsx';
import LandingPage from '@/pages/LandingPage.jsx';
import AuthPage from '@/pages/AuthPage.jsx';
import CustomerDashboard from '@/pages/CustomerDashboard.jsx';
import TenantDashboard from '@/pages/TenantDashboard.jsx';
import MallManagerDashboard from '@/pages/MallManagerDashboard.jsx';
import ExecutiveDashboard from '@/pages/ExecutiveDashboard.jsx';
import EmployeeDashboard from '@/pages/EmployeeDashboard.jsx';
import { LoadingSpinner } from '@/components/ui/index.jsx';

const ROLE_DASHBOARDS = {
  customer: <CustomerDashboard />,
  tenant: <TenantDashboard role="tenant" />,
  shop_manager: <TenantDashboard role="shop_manager" />,
  mall_manager: <MallManagerDashboard />,
  executive: <ExecutiveDashboard />,
  employee: <EmployeeDashboard />,
};

function AppContent() {
  const { user, loading } = useAuth();
  const { route } = useRouter();

  if (loading) return <LoadingSpinner label="Loading..." />;

  // Public routes
  if (route === '/' || route === '') return <LandingPage />;
  // Accounts are created on first Google sign-in, so signup and signin are the same page.
  if (route === '/signin' || route === '/signup') return <AuthPage />;

  // Protected app routes — require auth
  if (route.startsWith('/app/')) {
    if (!user) return <AuthPage />;

    const role = user.role;
    const dashboard = ROLE_DASHBOARDS[role];

    if (!dashboard) return <AuthPage mode="signin" />;

    return <AppShell>{dashboard}</AppShell>;
  }

  // Fallback
  return <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}

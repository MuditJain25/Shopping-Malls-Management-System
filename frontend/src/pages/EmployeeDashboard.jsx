import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';
import { LoadingSpinner } from '@/components/ui/index.jsx';

import Overview from './EmployeeDashboardComponents/Overview';
import AttendanceView from './EmployeeDashboardComponents/AttendanceView';
import LeaveView  from './EmployeeDashboardComponents/LeaveView';
import ProfileView from './EmployeeDashboardComponents/ProfileView';
import SalaryView from './EmployeeDashboardComponents/SalaryView';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { route } = useRouter();

  if (!user) return <LoadingSpinner />;

  const empId = user.profileId;
  const pageKey = route.split('/').pop() || 'employee';

  if (pageKey === 'employee') return <Overview empId={empId} user={user} />;
  if (pageKey === 'attendance') return <AttendanceView empId={empId} />;
  if (pageKey === 'leave') return <LeaveView empId={empId} />;
  if (pageKey === 'salary') return <SalaryView empId={empId} />;
  if (pageKey === 'profile') return <ProfileView empId={empId} user={user} />;
  return <Overview empId={empId} user={user} />;
}

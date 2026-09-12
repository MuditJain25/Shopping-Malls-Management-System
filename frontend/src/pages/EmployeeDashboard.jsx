import { useState, useEffect } from 'react';
import {
  Home, Clock, FileText, Briefcase, User,
  Calendar, CheckCircle2, XCircle, AlertCircle, DollarSign,
  LogIn, LogOut, Plus, TrendingUp, Mail, Phone, Building2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';
import { PageHeader, StatCard, DataTable, Badge, EmptyState, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import {
  getEmployeeById, getLeaveRequestsByEmployee, getPayrollByEmployee,
  getAttendanceByEmployee, employees, getStoreById, getMallById,
  attendanceRecords, leaveRequests
} from '@/lib/mockData.js';
import {
  apiGetEmployeeById, apiGetLeaveRequests, apiApplyLeave,
  apiGetPayroll, apiGetAttendance, apiCheckIn, apiCheckOut
} from '@/lib/api.js';

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



// function getStoreName(storeId) {
//   const s = getStoreById(storeId);
//   return s ? s.store_name : storeId;
// }

// function getMallName(mallId) {
//   const m = getMallById(mallId);
//   return m ? `${m.city}, ${m.state}` : mallId;
// }

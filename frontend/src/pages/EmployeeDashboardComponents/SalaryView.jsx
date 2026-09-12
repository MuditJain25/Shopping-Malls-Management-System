import { PageHeader, StatCard, DataTable, Badge, EmptyState, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import {
  Home, Clock, FileText, Briefcase, User,
  Calendar, CheckCircle2, XCircle, AlertCircle, DollarSign,
  LogIn, LogOut, Plus, TrendingUp, Mail, Phone, Building2
} from 'lucide-react';

import {
  getEmployeeById, getLeaveRequestsByEmployee, getPayrollByEmployee,
  getAttendanceByEmployee, employees, getStoreById, getMallById,
  attendanceRecords, leaveRequests
} from '@/lib/mockData.js';
import {
  apiGetEmployeeById, apiGetLeaveRequests, apiApplyLeave,
  apiGetPayroll, apiGetAttendance, apiCheckIn, apiCheckOut
} from '@/lib/api.js';

export default function SalaryView({ empId }) {
  const payroll = getPayrollByEmployee(empId);
  const employee = getEmployeeById(empId);
  const totalEarnings = payroll.filter(p => p.record_type !== 'deduction').reduce((s, p) => s + p.amount, 0);
  const totalDeductions = payroll.filter(p => p.record_type === 'deduction').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader title="Salary Slips" subtitle="Your payroll and earnings history" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Base Salary" value={`$${employee?.base_salary.toLocaleString() || 0}`} color="brand" />
        <StatCard icon={TrendingUp} label="Total Earnings" value={`$${totalEarnings.toLocaleString()}`} color="success" />
        <StatCard icon={Briefcase} label="Pay Records" value={payroll.length} color="accent" />
      </div>
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'record_id', label: 'Slip ID', render: p => <span className="text-slate-400 font-mono text-xs">{p.record_id}</span> },
            { key: 'record_type', label: 'Type', render: p => <Badge variant={p.record_type === 'salary' ? 'brand' : p.record_type === 'bonus' ? 'success' : 'error'}>{p.record_type}</Badge> },
            { key: 'amount', label: 'Amount', render: p => <span className="font-semibold text-slate-900">${p.amount.toLocaleString()}</span> },
            { key: 'issue_date', label: 'Issue Date', render: p => <span className="text-slate-500">{p.issue_date}</span> },
          ]}
          rows={payroll}
          emptyMessage="No salary records yet."
        />
      </div>
    </div>
  );
}
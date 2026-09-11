import { useState } from 'react';

// 2. Icons (Assuming you are using 'lucide-react' based on the prop signature and names)
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  LogIn, 
  LogOut 
} from 'lucide-react';

import { PageHeader, StatCard, DataTable, Badge, EmptyState, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import {
  getEmployeeById, getLeaveRequestsByEmployee, getPayrollByEmployee,
  getAttendanceByEmployee, employees, getStoreById, getMallById,
  attendanceRecords, leaveRequests
} from '@/lib/mockData.js';

export default function Overview({ empId, user }) {
  const employee = getEmployeeById(empId);
  const leaveReqs = getLeaveRequestsByEmployee(empId);
  const payroll = getPayrollByEmployee(empId);
  const attendance = getAttendanceByEmployee(empId);
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find(a => a.date === today);
  const pendingLeaves = leaveReqs.filter(l => l.status === 'pending').length;

  if (!employee) return <EmptyState title="Profile not found" message="Your employee profile could not be loaded." />;

  return (
    <div>
      <PageHeader title={`Welcome, ${user.firstName}`} subtitle={employee.current_designation} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Monthly Salary" value={`$${employee.base_salary.toLocaleString()}`} color="success" />
        <StatCard icon={Calendar} label="Days Present" value={attendance.length} color="brand" />
        <StatCard icon={FileText} label="Pending Leaves" value={pendingLeaves} color="warning" />
        <StatCard icon={Briefcase} label="Pay Records" value={payroll.length} color="accent" />
      </div>

      {/* Quick Attendance */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Today's Attendance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-brand-600" />
            <div>
              <p className="font-medium text-slate-900 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              {todayRecord?.check_in_time ? (
                <p className="text-xs text-slate-500">
                  Checked in at {todayRecord.check_in_time}
                  {todayRecord?.check_out_time && ` · Checked out at ${todayRecord.check_out_time}`}
                </p>
              ) : (
                <p className="text-xs text-slate-400">Not checked in yet</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!todayRecord?.check_in_time && <CheckInButton empId={empId} />}
            {todayRecord?.check_in_time && !todayRecord?.check_out_time && <CheckOutButton empId={empId} />}
            {todayRecord?.check_in_time && todayRecord?.check_out_time && <Badge variant="success">Complete</Badge>}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Recent Leave Requests</h3>
          <div className="card p-3 space-y-2">
            {leaveReqs.length === 0 ? <EmptyState title="No leave requests" /> : leaveReqs.slice(0, 3).map(lr => (
              <div key={lr.request_id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{lr.start_date} → {lr.end_date}</p>
                  <p className="text-xs text-slate-400">{lr.reason}</p>
                </div>
                <LeaveBadge status={lr.status} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Recent Salary</h3>
          <div className="card p-3 space-y-2">
            {payroll.length === 0 ? <EmptyState title="No payroll records" /> : payroll.slice(0, 3).map(pr => (
              <div key={pr.record_id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800 capitalize">{pr.record_type}</p>
                  <p className="text-xs text-slate-400">{pr.issue_date}</p>
                </div>
                <span className="font-semibold text-slate-900 text-sm">${pr.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaveBadge({ status }) {
  if (status === 'approved') return <Badge variant="success"><CheckCircle2 size={12} /> Approved</Badge>;
  if (status === 'rejected') return <Badge variant="error"><XCircle size={12} /> Rejected</Badge>;
  return <Badge variant="warning"><AlertCircle size={12} /> Pending</Badge>;
}

function CheckInButton({ empId }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    // REAL API: await apiCheckIn(empId);
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().slice(0, 5);
    const existing = attendanceRecords.find(a => a.e_id === empId && a.date === today);
    if (existing) existing.check_in_time = time;
    else attendanceRecords.push({ e_id: empId, date: today, check_in_time: time, check_out_time: null });
    setLoading(false);
    window.location.reload();
  };
  return <button onClick={handle} disabled={loading} className="btn-primary text-sm"><LogIn size={16} /> {loading ? '...' : 'Check In'}</button>;
}

function CheckOutButton({ empId }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    // REAL API: await apiCheckOut(empId);
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().slice(0, 5);
    const existing = attendanceRecords.find(a => a.e_id === empId && a.date === today);
    if (existing) existing.check_out_time = time;
    setLoading(false);
    window.location.reload();
  };
  return <button onClick={handle} disabled={loading} className="btn-secondary text-sm"><LogOut size={16} /> {loading ? '...' : 'Check Out'}</button>;
}


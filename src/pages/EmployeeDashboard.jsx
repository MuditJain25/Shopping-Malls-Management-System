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

// ════════════════════════════════════════════════════════════════
function Overview({ empId, user }) {
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

// ════════════════════════════════════════════════════════════════
function AttendanceView({ empId }) {
  const records = getAttendanceByEmployee(empId);
  return (
    <div>
      <PageHeader title="Attendance" subtitle="Your attendance history" />
      <div className="flex gap-2 mb-6">
        <CheckInButton empId={empId} />
        <CheckOutButton empId={empId} />
      </div>
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'date', label: 'Date', render: a => <span className="font-medium text-slate-800">{a.date}</span> },
            { key: 'check_in_time', label: 'Check In', render: a => <span className="text-slate-600">{a.check_in_time || '—'}</span> },
            { key: 'check_out_time', label: 'Check Out', render: a => <span className="text-slate-600">{a.check_out_time || '—'}</span> },
            { key: 'duration', label: 'Hours', render: a => {
              if (!a.check_in_time || !a.check_out_time) return <span className="text-slate-400">—</span>;
              const [ih, im] = a.check_in_time.split(':').map(Number);
              const [oh, om] = a.check_out_time.split(':').map(Number);
              const mins = (oh * 60 + om) - (ih * 60 + im);
              return <span className="font-medium text-slate-700">{(mins / 60).toFixed(1)}h</span>;
            }},
            { key: 'status', label: 'Status', render: a => a.check_out_time ? <Badge variant="success">Complete</Badge> : <Badge variant="warning">In Progress</Badge> },
          ]}
          rows={records}
          emptyMessage="No attendance records yet."
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
function LeaveView({ empId }) {
  const [showApply, setShowApply] = useState(false);
  const [newLeave, setNewLeave] = useState({ start_date: '', end_date: '', reason: '' });
  const [refresh, setRefresh] = useState(0);

  const leaveReqs = getLeaveRequestsByEmployee(empId);

  const handleApply = async () => {
    // REAL API: await apiApplyLeave(empId, newLeave);
    leaveRequests.push({
      e_id: empId,
      request_id: `lr${Date.now()}`,
      ...newLeave,
      status: 'pending',
    });
    setShowApply(false);
    setNewLeave({ start_date: '', end_date: '', reason: '' });
    setRefresh(r => r + 1);
  };

  return (
    <div key={refresh}>
      <PageHeader
        title="Leave Requests"
        subtitle="Apply for and track your leave requests"
        action={<button onClick={() => setShowApply(true)} className="btn-primary text-sm"><Plus size={16} /> Apply for Leave</button>}
      />
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'dates', label: 'Dates', render: l => <span className="font-medium text-slate-800">{l.start_date} → {l.end_date}</span> },
            { key: 'reason', label: 'Reason', render: l => <span className="text-slate-600">{l.reason}</span> },
            { key: 'status', label: 'Status', render: l => <LeaveBadge status={l.status} /> },
          ]}
          rows={leaveReqs}
          emptyMessage="No leave requests submitted yet."
        />
      </div>

      <Modal open={showApply} onClose={() => setShowApply(false)} title="Apply for Leave" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" value={newLeave.start_date} onChange={e => setNewLeave({ ...newLeave, start_date: e.target.value })} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" value={newLeave.end_date} onChange={e => setNewLeave({ ...newLeave, end_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea className="input min-h-[80px]" value={newLeave.reason} onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })} placeholder="Please provide a reason for your leave request..." />
          </div>
          <button onClick={handleApply} className="btn-primary w-full">Submit Request</button>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
function SalaryView({ empId }) {
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

// ════════════════════════════════════════════════════════════════
function ProfileView({ empId, user }) {
  const employee = getEmployeeById(empId);
  if (!employee) return <EmptyState title="Profile not found" />;

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your personal and employment information" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{user.firstName} {user.lastName}</h3>
              <p className="text-sm text-slate-500">{employee.current_designation}</p>
            </div>
          </div>
          <div className="space-y-2">
            <ProfileRow icon={Mail} label="Email" value={employee.email} />
            <ProfileRow icon={Phone} label="Phone" value={employee.phone_number} />
            <ProfileRow icon={Calendar} label="Date of Joining" value={employee.date_of_joining} />
            <ProfileRow icon={Briefcase} label="Designation" value={employee.current_designation} />
            <ProfileRow icon={DollarSign} label="Base Salary" value={`${employee.base_salary.toLocaleString()}`} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Employment Details</h3>
          <div className="space-y-2">
            <ProfileRow icon={User} label="Employee ID" value={employee.employee_id} />
            <ProfileRow icon={Building2} label="Store" value={employee.store_id ? getStoreName(employee.store_id) : 'Direct Mall Hire'} />
            <ProfileRow icon={Building2} label="Mall" value={getMallName(employee.mall_id)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50">
      <Icon size={16} className="text-slate-400 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function getStoreName(storeId) {
  const s = getStoreById(storeId);
  return s ? s.store_name : storeId;
}

function getMallName(mallId) {
  const m = getMallById(mallId);
  return m ? `${m.city}, ${m.state}` : mallId;
}

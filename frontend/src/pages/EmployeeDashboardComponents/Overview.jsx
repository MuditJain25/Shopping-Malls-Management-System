import { useState, useEffect } from 'react';

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

import { PageHeader, StatCard, Badge, EmptyState, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import {
  apiGetEmployeeById, apiGetLeaveRequests, apiGetPayroll,
  apiGetAttendance, apiCheckIn, apiCheckOut
} from '@/lib/api.js';

export default function Overview({ empId, user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([
      apiGetEmployeeById(empId),
      apiGetLeaveRequests(empId),
      apiGetPayroll(empId),
      apiGetAttendance(empId),
    ])
      .then(([employee, leaveReqs, payroll, attendance]) => {
        if (!cancelled) setData({ employee, leaveReqs, payroll, attendance });
      })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [empId, refresh]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingSpinner label="Loading dashboard..." />;

  const { employee, leaveReqs, payroll, attendance } = data;
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
            {!todayRecord?.check_in_time && <CheckInButton empId={empId} onDone={() => setRefresh(r => r + 1)} />}
            {todayRecord?.check_in_time && !todayRecord?.check_out_time && <CheckOutButton empId={empId} onDone={() => setRefresh(r => r + 1)} />}
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

function CheckInButton({ empId, onDone }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handle = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiCheckIn(empId);
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <button onClick={handle} disabled={loading} className="btn-primary text-sm"><LogIn size={16} /> {loading ? '...' : 'Check In'}</button>
      {error && <span className="text-xs text-red-500 self-center">{error}</span>}
    </>
  );
}

function CheckOutButton({ empId, onDone }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handle = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiCheckOut(empId);
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <button onClick={handle} disabled={loading} className="btn-secondary text-sm"><LogOut size={16} /> {loading ? '...' : 'Check Out'}</button>
      {error && <span className="text-xs text-red-500 self-center">{error}</span>}
    </>
  );
}

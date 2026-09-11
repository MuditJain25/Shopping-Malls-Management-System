import React from "react";
import { useState } from "react";
import { LogIn,LogOut } from "lucide-react";
import { PageHeader, StatCard, DataTable, Badge, EmptyState, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';

import { getAttendanceByEmployee } from '@/lib/mockData.js';

export default function AttendanceView({ empId }) {
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
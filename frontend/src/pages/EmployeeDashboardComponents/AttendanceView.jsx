import { useState, useEffect } from "react";
import { LogIn, LogOut } from "lucide-react";
import { PageHeader, DataTable, Badge, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';

import { apiGetAttendance, apiCheckIn, apiCheckOut } from '@/lib/api.js';

export default function AttendanceView({ empId }) {
  const [records, setRecords] = useState(null);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    apiGetAttendance(empId)
      .then(data => { if (!cancelled) setRecords(data); })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [empId, refresh]);

  if (error) return <ErrorState message={error} />;
  if (!records) return <LoadingSpinner label="Loading attendance..." />;

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Your attendance history" />
      <div className="flex gap-2 mb-6">
        <CheckInButton empId={empId} onDone={() => setRefresh(r => r + 1)} />
        <CheckOutButton empId={empId} onDone={() => setRefresh(r => r + 1)} />
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
    <div className="flex items-center gap-2">
      <button onClick={handle} disabled={loading} className="btn-primary text-sm"><LogIn size={16} /> {loading ? '...' : 'Check In'}</button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
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
    <div className="flex items-center gap-2">
      <button onClick={handle} disabled={loading} className="btn-secondary text-sm"><LogOut size={16} /> {loading ? '...' : 'Check Out'}</button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

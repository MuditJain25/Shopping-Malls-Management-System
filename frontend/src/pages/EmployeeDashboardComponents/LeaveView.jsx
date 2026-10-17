import { useState, useEffect } from "react";
import { Plus, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { PageHeader, DataTable, Badge, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';

import { apiGetLeaveRequests, apiApplyLeave } from '@/lib/api.js';

export default function LeaveView({ empId }) {
  const [leaveReqs, setLeaveReqs] = useState(null);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [showApply, setShowApply] = useState(false);
  const [newLeave, setNewLeave] = useState({ start_date: '', end_date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [applyError, setApplyError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    apiGetLeaveRequests(empId)
      .then(data => { if (!cancelled) setLeaveReqs(data); })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [empId, refresh]);

  const handleApply = async () => {
    setSaving(true);
    setApplyError(null);
    try {
      await apiApplyLeave(empId, newLeave);
      setShowApply(false);
      setNewLeave({ start_date: '', end_date: '', reason: '' });
      setRefresh(r => r + 1);
    } catch (e) {
      setApplyError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!leaveReqs) return <LoadingSpinner label="Loading leave requests..." />;

  return (
    <div>
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
          {applyError && <ErrorState message={applyError} />}
          <button onClick={handleApply} disabled={saving} className="btn-primary w-full">{saving ? 'Submitting...' : 'Submit Request'}</button>
        </div>
      </Modal>
    </div>
  );
}
function LeaveBadge({ status }) {
  if (status === 'approved') return <Badge variant="success"><CheckCircle2 size={12} /> Approved</Badge>;
  if (status === 'rejected') return <Badge variant="error"><XCircle size={12} /> Rejected</Badge>;
  return <Badge variant="warning"><AlertCircle size={12} /> Pending</Badge>;
}

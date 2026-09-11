import { useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import {PageHeader,DataTable,Badge} from '@/components/ui/index.jsx'
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

export default function LeaveView({ empId }) {
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
function LeaveBadge({ status }) {
  if (status === 'approved') return <Badge variant="success"><CheckCircle2 size={12} /> Approved</Badge>;
  if (status === 'rejected') return <Badge variant="error"><XCircle size={12} /> Rejected</Badge>;
  return <Badge variant="warning"><AlertCircle size={12} /> Pending</Badge>;
}

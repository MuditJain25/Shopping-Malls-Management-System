import { useState } from 'react';
import { FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { PageHeader, Badge, EmptyState } from '@/components/ui/index.jsx';
import {
  getLeaveRequestsByStore, getEmployeeById, leaveRequests
} from '@/lib/mockData.js';

export default function LeaveView({ stores }) {
  const [selectedStore, setSelectedStore] = useState(stores[0]?.store_id || '');
  const [refresh, setRefresh] = useState(0);

  const store = stores.find(s => s.store_id === selectedStore) || stores[0];
  const leaveReqs = store ? getLeaveRequestsByStore(store.store_id) : [];

  const handleApprove = (requestId) => {
    const req = leaveRequests.find(l => l.request_id === requestId);
    if (req) req.status = 'approved';
    setRefresh(r => r + 1);
  };

  const handleReject = (requestId) => {
    const req = leaveRequests.find(l => l.request_id === requestId);
    if (req) req.status = 'rejected';
    setRefresh(r => r + 1);
  };

  if (!store) return <EmptyState title="No stores" message="You don't have any stores yet." />;

  return (
    <div key={refresh}>
      <PageHeader title="Leave Requests" subtitle="Review and approve leave requests from your employees" />
      {stores.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {stores.map(s => (
            <button
              key={s.store_id}
              onClick={() => setSelectedStore(s.store_id)}
              className={`px-3 py-1.5 rounded-lg text-sm ${selectedStore === s.store_id ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
            >
              {s.store_name}
            </button>
          ))}
        </div>
      )}

      {leaveReqs.length === 0 ? (
        <EmptyState icon={FileText} title="No leave requests" message="No leave requests from employees in this store." />
      ) : (
        <div className="space-y-3">
          {leaveReqs.map(lr => {
            const emp = getEmployeeById(lr.e_id);
            return (
              <div key={lr.request_id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{emp ? `${emp.first_name} ${emp.last_name}` : lr.e_id}</p>
                    <p className="text-xs text-slate-400">{emp?.current_designation || ''}</p>
                  </div>
                  {lr.status === 'approved' && <Badge variant="success"><CheckCircle2 size={12} /> Approved</Badge>}
                  {lr.status === 'rejected' && <Badge variant="error"><XCircle size={12} /> Rejected</Badge>}
                  {lr.status === 'pending' && <Badge variant="warning"><AlertCircle size={12} /> Pending</Badge>}
                </div>
                <div className="text-sm text-slate-600 mb-2">
                  <span className="text-slate-500">Dates: </span>
                  {lr.start_date} → {lr.end_date}
                </div>
                <p className="text-sm text-slate-500 mb-3">{lr.reason}</p>
                {lr.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(lr.request_id)} className="btn bg-green-600 text-white hover:bg-green-700 px-4 py-1.5 text-sm font-semibold rounded-lg">
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button onClick={() => handleReject(lr.request_id)} className="btn bg-red-600 text-white hover:bg-red-700 px-4 py-1.5 text-sm font-semibold rounded-lg">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

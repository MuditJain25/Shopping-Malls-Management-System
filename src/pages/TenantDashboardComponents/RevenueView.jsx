import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, DataTable } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { getRevenueByTenant, revenueInfo } from '@/lib/mockData.js';

export default function RevenueView({ tenantId }) {
  const [showSubmit, setShowSubmit] = useState(false);
  const [newReport, setNewReport] = useState({ description: '', month: '', amount: '' });
  const [refresh, setRefresh] = useState(0);

  const reports = getRevenueByTenant(tenantId);
  const totalRevenue = reports.reduce((sum, r) => sum + r.amount, 0);

  const handleSubmit = async () => {
    revenueInfo.push({
      tenant_id: tenantId,
      information_id: `ri${Date.now()}`,
      description: newReport.description,
      month: newReport.month,
      amount: parseFloat(newReport.amount),
      submitted_date: new Date().toISOString().split('T')[0],
    });
    setShowSubmit(false);
    setNewReport({ description: '', month: '', amount: '' });
    setRefresh(r => r + 1);
  };

  return (
    <div key={refresh}>
      <PageHeader
        title="Revenue Reports"
        subtitle="Share revenue information with the mall"
        action={<button onClick={() => setShowSubmit(true)} className="btn-primary text-sm"><Plus size={16} /> Submit Report</button>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Total Revenue Reported</p>
          <p className="text-xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Reports Submitted</p>
          <p className="text-xl font-bold text-slate-900">{reports.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Avg Monthly Revenue</p>
          <p className="text-xl font-bold text-slate-900">${reports.length ? Math.round(totalRevenue / reports.length).toLocaleString() : 0}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'month', label: 'Month', render: r => <span className="font-medium text-slate-800">{r.month}</span> },
            { key: 'description', label: 'Description', render: r => <span className="text-slate-600">{r.description}</span> },
            { key: 'amount', label: 'Amount', render: r => <span className="font-semibold text-green-600">${r.amount.toLocaleString()}</span> },
            { key: 'submitted_date', label: 'Submitted', render: r => <span className="text-slate-500">{r.submitted_date}</span> },
          ]}
          rows={reports}
          emptyMessage="No revenue reports submitted yet."
        />
      </div>

      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Submit Revenue Report" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Month</label>
            <input className="input" value={newReport.month} onChange={e => setNewReport({ ...newReport, month: e.target.value })} placeholder="e.g. September 2026" />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={newReport.description} onChange={e => setNewReport({ ...newReport, description: e.target.value })} placeholder="e.g. September 2026 revenue report" />
          </div>
          <div>
            <label className="label">Revenue Amount ($)</label>
            <input type="number" className="input" value={newReport.amount} onChange={e => setNewReport({ ...newReport, amount: e.target.value })} />
          </div>
          <button onClick={handleSubmit} className="btn-primary w-full">Submit Report</button>
        </div>
      </Modal>
    </div>
  );
}

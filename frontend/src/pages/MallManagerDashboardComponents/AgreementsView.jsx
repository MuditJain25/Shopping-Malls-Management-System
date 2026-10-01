import { PageHeader, DataTable, Badge } from '@/components/ui/index.jsx';
import { tenants, transactions, getMallById, getStoresByMall, revenueInfo } from '@/lib/mockData.js';

export default function AgreementsView({ mallId }) {
  const mallStores = getStoresByMall(mallId).filter(s => s.status === 'occupied');
  const mallTenants = tenants.filter(t => t.store_ids.some(sid => mallStores.some(s => s.store_id === sid)));
  const mallName = getMallById(mallId)?.city === 'New York' ? 'Heritage Plaza Mall' : getMallById(mallId)?.city === 'San Jose' ? 'Tech Park Mall' : 'Lakeshore Mall';
  const mallTransactions = transactions.filter(t => t.receiver === mallName);

  return (
    <div>
      <PageHeader title="Store Agreements & Tenants" subtitle="Complete transaction and agreement information" />

      <h3 className="font-semibold text-slate-900 mb-3">Tenant Agreements</h3>
      <div className="card overflow-hidden mb-8">
        <DataTable
          columns={[
            { key: 'business_name', label: 'Business', render: t => <span className="font-medium text-slate-800">{t.business_name}</span> },
            { key: 'business_type', label: 'Type', render: t => <Badge variant="brand">{t.business_type}</Badge> },
            { key: 'stores', label: 'Stores', render: t => <span className="text-slate-600">{t.store_ids.length}</span> },
            { key: 'email', label: 'Contact', render: t => <span className="text-slate-600">{t.email}</span> },
            { key: 'registered', label: 'Since', render: t => <span className="text-slate-500">{t.date_registered}</span> },
          ]}
          rows={mallTenants}
          emptyMessage="No tenant agreements found."
        />
      </div>

      <h3 className="font-semibold text-slate-900 mb-3">Transaction History</h3>
      <div className="card overflow-hidden mb-8">
        <DataTable
          columns={[
            { key: 'sender', label: 'From', render: t => <span className="font-medium text-slate-800">{t.sender}</span> },
            { key: 'amount', label: 'Amount', render: t => <span className="font-semibold text-success-600">${t.amount.toLocaleString()}</span> },
            { key: 'date', label: 'Date', render: t => <span className="text-slate-500">{t.transaction_date}</span> },
            { key: 'remarks', label: 'Remarks', render: t => <span className="text-slate-500 text-xs">{t.remarks}</span> },
          ]}
          rows={mallTransactions}
          emptyMessage="No transactions recorded."
        />
      </div>

      <h3 className="font-semibold text-slate-900 mb-3">Tenant Revenue Submissions</h3>
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'tenant', label: 'Tenant', render: r => { const t = tenants.find(t => t.tenant_id === r.tenant_id); return <span className="font-medium text-slate-800">{t?.business_name || r.tenant_id}</span>; } },
            { key: 'month', label: 'Month', render: r => <span className="text-slate-600">{r.month}</span> },
            { key: 'amount', label: 'Revenue', render: r => <span className="font-semibold text-slate-900">${r.amount.toLocaleString()}</span> },
            { key: 'submitted_date', label: 'Submitted', render: r => <span className="text-slate-500">{r.submitted_date}</span> },
          ]}
          rows={revenueInfo.filter(r => mallTenants.some(t => t.tenant_id === r.tenant_id))}
          emptyMessage="No revenue reports submitted."
        />
      </div>
    </div>
  );
}

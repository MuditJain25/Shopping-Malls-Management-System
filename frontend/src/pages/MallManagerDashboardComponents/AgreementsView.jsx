import { useState, useEffect } from 'react';
import { PageHeader, DataTable, Badge, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import { apiGetTenants, apiGetTransactionsByMall } from '@/lib/api.js';

export default function AgreementsView({ mallId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([apiGetTenants(mallId), apiGetTransactionsByMall(mallId)])
      .then(([mallTenants, mallTransactions]) => {
        if (!cancelled) setData({ mallTenants, mallTransactions });
      })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [mallId]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingSpinner label="Loading agreements..." />;

  const { mallTenants, mallTransactions } = data;

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
      <div className="card overflow-hidden">
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
    </div>
  );
}

import { PageHeader, DataTable, Badge } from '@/components/ui/index.jsx';
import { tenants } from '@/lib/mockData.js';

export default function TenantsView() {
  return (
    <div>
      <PageHeader title="All Tenants" subtitle="All tenants across all malls" />
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'business_name', label: 'Business', render: t => <span className="font-medium text-slate-800">{t.business_name}</span> },
            { key: 'business_type', label: 'Type', render: t => <Badge variant="brand">{t.business_type}</Badge> },
            { key: 'stores', label: 'Stores', render: t => <span className="text-slate-600">{t.store_ids.length}</span> },
            { key: 'email', label: 'Email', render: t => <span className="text-slate-600">{t.email}</span> },
            { key: 'phone', label: 'Phone', render: t => <span className="text-slate-600">{t.phone_number}</span> },
            { key: 'registered', label: 'Registered', render: t => <span className="text-slate-500">{t.date_registered}</span> },
          ]}
          rows={tenants}
          emptyMessage="No tenants found."
        />
      </div>
    </div>
  );
}

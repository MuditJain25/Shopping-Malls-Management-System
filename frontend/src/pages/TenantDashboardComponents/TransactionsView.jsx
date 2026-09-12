import { FileText, Download } from 'lucide-react';
import { PageHeader, DataTable, Badge } from '@/components/ui/index.jsx';
import {
  getTransactionsByTenant, getMallById, tenants
} from '@/lib/mockData.js';

function getTenantByStore(store) {
  return tenants.find(t => t.store_ids.includes(store.store_id));
}

export default function TransactionsView({ tenantId, isShopManager, stores }) {
  const transactions = isShopManager
    ? stores.flatMap(s => getTransactionsByTenant(getTenantByStore(s)?.tenant_id || '')).filter(Boolean)
    : getTransactionsByTenant(tenantId);

  const shopMgrTransactions = isShopManager
    ? stores.flatMap(s => {
        const tenant = tenants.find(t => t.store_ids.includes(s.store_id));
        return tenant ? getTransactionsByTenant(tenant.tenant_id) : [];
      })
    : transactions;

  const displayTransactions = isShopManager ? shopMgrTransactions : transactions;

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Store transaction history with the mall" />
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'transaction_id', label: 'ID', render: t => <span className="text-slate-400 font-mono text-xs">{t.transaction_id}</span> },
            { key: 'sender', label: 'From', render: t => <span className="font-medium text-slate-800">{t.sender}</span> },
            { key: 'receiver', label: 'To', render: t => <span className="text-slate-600">{t.receiver}</span> },
            { key: 'amount', label: 'Amount', render: t => <span className="font-semibold text-green-600">${t.amount.toLocaleString()}</span> },
            { key: 'date', label: 'Date', render: t => <span className="text-slate-500">{t.transaction_date}</span> },
            { key: 'remarks', label: 'Remarks', render: t => <span className="text-slate-500 text-xs">{t.remarks}</span> },
          ]}
          rows={displayTransactions}
          emptyMessage="No transactions recorded yet."
        />
      </div>

      <h3 className="font-semibold text-slate-900 mt-8 mb-4">Mall Agreement / Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stores.map(store => {
          const mall = getMallById(store.mall_id);
          return (
            <div key={store.store_id} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-brand-600" />
                <div>
                  <h4 className="font-medium text-slate-900 text-sm">{store.store_name}</h4>
                  <p className="text-xs text-slate-400">{mall?.city}, {mall?.state}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Agreement Type</span>
                  <span className="font-medium text-slate-700">Lease Agreement</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Rent</span>
                  <span className="font-medium text-slate-700">${(store.area_sqft * 5).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
              <button className="btn-secondary w-full mt-3 text-sm">
                <Download size={14} /> View Agreement
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

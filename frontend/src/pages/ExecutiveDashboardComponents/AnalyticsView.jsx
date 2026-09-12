import { Building2, Users, Store, DollarSign, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/index.jsx';
import { malls, tenants, employees, transactions, getStoresByMall } from '@/lib/mockData.js';

export default function AnalyticsView() {
  const mallNames = { m1: 'Heritage Plaza', m2: 'Tech Park Mall', m3: 'Lakeshore Mall' };
  const mallReceivers = { m1: 'Heritage Plaza Mall', m2: 'Tech Park Mall', m3: 'Lakeshore Mall' };

  return (
    <div>
      <PageHeader title="Mall Performance Analytics" subtitle="Revenue, customers, and partner metrics per mall" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {malls.map(mall => {
          const mallStores = getStoresByMall(mall.mall_id);
          const occupied = mallStores.filter(s => s.status === 'occupied');
          const mallTxns = transactions.filter(t => t.receiver === mallReceivers[mall.mall_id]);
          const totalRevenue = mallTxns.reduce((s, t) => s + t.amount, 0);
          const mallTenants = tenants.filter(t => t.store_ids.some(sid => mallStores.some(s => s.store_id === sid)));
          const mallEmps = employees.filter(e => e.mall_id === mall.mall_id);
          const customers = mall.mall_id === 'm1' ? 15700 : mall.mall_id === 'm2' ? 14600 : 14300;

          return (
            <div key={mall.mall_id} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={18} className="text-brand-600" />
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{mallNames[mall.mall_id]}</h3>
                  <p className="text-xs text-slate-400">{mall.city}, {mall.state}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="flex items-center gap-2 text-sm text-slate-500"><DollarSign size={14} /> Revenue</span>
                  <span className="font-bold text-slate-900 text-sm">${totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="flex items-center gap-2 text-sm text-slate-500"><Users size={14} /> Customers</span>
                  <span className="font-bold text-slate-900 text-sm">{customers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="flex items-center gap-2 text-sm text-slate-500"><TrendingUp size={14} /> Avg/Store</span>
                  <span className="font-bold text-slate-900 text-sm">${occupied.length ? Math.round(totalRevenue / occupied.length).toLocaleString() : 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="flex items-center gap-2 text-sm text-slate-500"><Store size={14} /> Partners</span>
                  <span className="font-bold text-slate-900 text-sm">{mallTenants.length}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="flex items-center gap-2 text-sm text-slate-500"><Users size={14} /> Employees</span>
                  <span className="font-bold text-slate-900 text-sm">{mallEmps.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

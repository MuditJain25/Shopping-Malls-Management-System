import { Store, Package, Users, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { PageHeader, StatCard, Badge } from '@/components/ui/index.jsx';
import {
  getProductsByStore, getEmployeesByStore,
  getTransactionsByTenant, getMallById,
} from '@/lib/mockData.js';

export default function Overview({ role, stores, tenantId }) {
  const { user } = useAuth();
  const isShopManager = role === 'shop_manager';
  const allEmployees = stores.flatMap(s => getEmployeesByStore(s.store_id));
  const allProducts = stores.flatMap(s => getProductsByStore(s.store_id));
  const topProducts = allProducts.filter(p => p.to_show);
  const transactions = isShopManager ? [] : getTransactionsByTenant(tenantId);
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.firstName}`}
        subtitle={isShopManager ? `Managing ${stores[0]?.store_name}` : `${stores.length} stores across malls`}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Store} label="Active Stores" value={stores.length} color="brand" />
        <StatCard icon={Users} label="Employees" value={allEmployees.length} color="success" />
        <StatCard icon={Package} label="Total Products" value={allProducts.length} color="accent" />
        <StatCard icon={Star} label="Top Selling" value={topProducts.length} color="warning" />
      </div>

      {!isShopManager && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-slate-900 text-sm mb-2">Total Rent Paid</h3>
          <p className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-slate-500 mt-1">{transactions.length} transactions</p>
        </div>
      )}

      <h3 className="font-semibold text-slate-900 mb-4">Your Stores</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map(store => {
          const mall = getMallById(store.mall_id);
          const storeEmps = getEmployeesByStore(store.store_id);
          const storeProds = getProductsByStore(store.store_id);
          return (
            <div key={store.store_id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Store size={18} className="text-brand-600" />
                  <div>
                    <h4 className="font-medium text-slate-900 text-sm">{store.store_name}</h4>
                    <p className="text-xs text-slate-400">{mall?.city} · Floor {store.floor}</p>
                  </div>
                </div>
                <Badge variant={store.status === 'occupied' ? 'success' : 'warning'}>{store.status}</Badge>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Users size={12} /> {storeEmps.length} emps</span>
                <span className="flex items-center gap-1"><Package size={12} /> {storeProds.length} products</span>
                <span className="flex items-center gap-1"><Star size={12} /> {storeProds.filter(p => p.to_show).length} top</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

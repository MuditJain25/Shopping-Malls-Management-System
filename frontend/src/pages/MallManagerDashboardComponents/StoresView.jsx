import { PageHeader, Badge } from '@/components/ui/index.jsx';
import { tenants, getEmployeesByMall, getStoresByMall } from '@/lib/mockData.js';

export default function StoresView({ mallId }) {
  const mallStores = getStoresByMall(mallId);
  return (
    <div>
      <PageHeader title="Stores" subtitle="All stores in this mall" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mallStores.map(store => {
          const tenant = tenants.find(t => t.store_ids.includes(store.store_id));
          const emps = getEmployeesByMall(mallId).filter(e => e.store_id === store.store_id);
          return (
            <div key={store.store_id} className="card overflow-hidden">
              <img src={store.listing_media[0]} alt={store.store_name} className="w-full h-28 object-cover" />
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900 text-sm">{store.store_name}</h4>
                  <Badge variant={store.status === 'occupied' ? 'success' : 'warning'}>{store.status}</Badge>
                </div>
                <p className="text-xs text-slate-400 mb-3">Shop {store.shop_number} · Floor {store.floor} · {store.area_sqft} sqft</p>
                <div className="space-y-1 text-sm">
                  {tenant && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tenant</span>
                      <span className="font-medium text-slate-700">{tenant.business_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Employees</span>
                    <span className="font-medium text-slate-700">{emps.length}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Store, Users, Gavel, Building2 } from 'lucide-react';
import { PageHeader, StatCard, Badge, EmptyState } from '@/components/ui/index.jsx';
import {
  tenants,
  getMallById, getStoresByMall, getEmployeesByMall,
  getBidEventsByMall, getBidsByEvent, getWinningBid, getStoreById
} from '@/lib/mockData.js';

export default function Overview({ mallId, manager }) {
  const mall = getMallById(mallId);
  const mallStores = getStoresByMall(mallId);
  const mallEmps = getEmployeesByMall(mallId);
  const events = getBidEventsByMall(mallId);
  const openEvents = events.filter(e => e.status === 'open');
  const mallTenants = tenants.filter(t => t.store_ids.some(sid => mallStores.some(s => s.store_id === sid)));
  const mallName = mall?.city === 'New York' ? 'Heritage Plaza' : mall?.city === 'San Jose' ? 'Tech Park Mall' : 'Lakeshore Mall';

  return (
    <div>
      <PageHeader title={`Welcome, ${manager?.first_name || 'Manager'}`} subtitle={`${mallName} · ${mall?.city}, ${mall?.state}`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Store} label="Total Stores" value={mallStores.length} color="brand" />
        <StatCard icon={Users} label="Employees" value={mallEmps.length} color="success" />
        <StatCard icon={Gavel} label="Active Bids" value={openEvents.length} color="warning" />
        <StatCard icon={Building2} label="Tenants" value={mallTenants.length} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Store Status</h3>
          <div className="space-y-2">
            {mallStores.map(s => (
              <div key={s.store_id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <Store size={14} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-800">{s.store_name}</span>
                </div>
                <Badge variant={s.status === 'occupied' ? 'success' : s.status === 'available' ? 'warning' : 'neutral'}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Bid Events</h3>
          <div className="space-y-2">
            {events.length === 0 ? <EmptyState title="No bid events" /> : events.map(ev => {
              const store = getStoreById(ev.store_id);
              const winning = getWinningBid(ev.event_id);
              return (
                <div key={ev.event_id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{store?.store_name}</p>
                    <p className="text-xs text-slate-400">Ends {ev.end_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">${(winning?.bid_amount || ev.minimum_bid_amount).toLocaleString()}</p>
                    <Badge variant={ev.status === 'open' ? 'success' : 'neutral'}>{ev.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

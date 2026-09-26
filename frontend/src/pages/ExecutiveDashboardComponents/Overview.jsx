import { Building2, Users, Store, Gavel } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { PageHeader, StatCard, Badge } from '@/components/ui/index.jsx';
import {
  malls, mallManagers, tenants, executives, bidEvents,
  getBidsByEvent, getWinningBid, getStoreById, getMallById,
  getStoresByMall,
} from '@/lib/mockData.js';

export default function Overview() {
  const { user } = useAuth();
  const exec = executives.find(e => e.executive_id === user.profileId);
  const allEvents = bidEvents;
  const openEvents = allEvents.filter(e => e.status === 'open');
  const finalizedEvents = allEvents.filter(e => e.status === 'finalized');

  return (
    <div>
      <PageHeader title={`Welcome, ${user.firstName}`} subtitle="Enterprise-wide overview across all malls" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Total Malls" value={malls.length} color="brand" />
        <StatCard icon={Users} label="Managers" value={mallManagers.length} color="success" />
        <StatCard icon={Store} label="Tenants" value={tenants.length} color="accent" />
        <StatCard icon={Gavel} label="Active Bids" value={openEvents.length} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Malls Under Oversight</h3>
          <div className="space-y-2">
            {malls.map(mall => {
              const mgr = mallManagers.find(mm => mm.mall_id === mall.mall_id);
              return (
                <div key={mall.mall_id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{mall.city === 'New York' ? 'Heritage Plaza' : mall.city === 'San Jose' ? 'Tech Park Mall' : 'Lakeshore Mall'}</p>
                      <p className="text-xs text-slate-400">{mall.city}, {mall.state}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Manager</p>
                    <p className="text-sm font-medium text-slate-700">{mgr ? `${mgr.first_name} ${mgr.last_name}` : '—'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Bid Events Summary</h3>
          <div className="space-y-2">
            {allEvents.map(ev => {
              const store = getStoreById(ev.store_id);
              const winning = getWinningBid(ev.event_id);
              return (
                <div key={ev.event_id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{store?.store_name}</p>
                    <p className="text-xs text-slate-400">{ev.start_date} → {ev.end_date}</p>
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

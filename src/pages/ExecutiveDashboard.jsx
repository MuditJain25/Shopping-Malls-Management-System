import { useState } from 'react';
import {
  Home, Building2, Users, Gavel, BarChart3, User,
  Plus, Store, DollarSign, TrendingUp, Trophy, Phone, Mail,
  CheckCircle2, Lock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';
import { PageHeader, StatCard, DataTable, Badge, EmptyState, LoadingSpinner } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import {
  malls, mallManagers, tenants, executives, bidEvents,
  getBidsByEvent, getWinningBid, getStoreById, getMallById,
  getStoresByMall, transactions, employees, mallManagers as mgrs
} from '@/lib/mockData.js';
import { apiCreateManager, apiFinalizeBidEvent } from '@/lib/api.js';

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const { route } = useRouter();
  if (!user) return <LoadingSpinner />;
  const pageKey = route.split('/').pop() || 'executive';

  if (pageKey === 'executive') return <Overview />;
  if (pageKey === 'malls') return <MallsView />;
  if (pageKey === 'tenants') return <TenantsView />;
  if (pageKey === 'bids') return <BidsView />;
  if (pageKey === 'analytics') return <AnalyticsView />;
  if (pageKey === 'create-manager') return <CreateManagerView />;
  return <Overview />;
}

function Overview() {
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

function MallsView() {
  return (
    <div>
      <PageHeader title="Malls & Managers" subtitle="All malls and their assigned Mall Managers" />
      <div className="card overflow-hidden mb-8">
        <DataTable
          columns={[
            { key: 'mall', label: 'Mall', render: m => {
              const mall = getMallById(m.mall_id);
              return <span className="font-medium text-slate-800">{mall?.city === 'New York' ? 'Heritage Plaza' : mall?.city === 'San Jose' ? 'Tech Park Mall' : 'Lakeshore Mall'}</span>;
            }},
            { key: 'location', label: 'Location', render: m => { const mall = getMallById(m.mall_id); return <span className="text-slate-600">{mall?.city}, {mall?.state}</span>; }},
            { key: 'manager', label: 'Manager', render: m => <span className="font-medium text-slate-800">{m.first_name} {m.last_name}</span> },
            { key: 'email', label: 'Email', render: m => <span className="text-slate-600">{m.email}</span> },
            { key: 'phone', label: 'Phone', render: m => <span className="text-slate-600">{m.phone_number}</span> },
            { key: 'joined', label: 'Joined', render: m => <span className="text-slate-500">{m.date_joined}</span> },
          ]}
          rows={mallManagers}
          emptyMessage="No managers found."
        />
      </div>

      <h3 className="font-semibold text-slate-900 mb-3">All Malls</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {malls.map(mall => {
          const mgr = mallManagers.find(mm => mm.mall_id === mall.mall_id);
          const mallStores = getStoresByMall(mall.mall_id);
          return (
            <div key={mall.mall_id} className="card overflow-hidden">
              <img src={mall.imageUrl} alt={mall.city} className="w-full h-32 object-cover" />
              <div className="p-4">
                <h4 className="font-medium text-slate-900">{mall.city === 'New York' ? 'Heritage Plaza' : mall.city === 'San Jose' ? 'Tech Park Mall' : 'Lakeshore Mall'}</h4>
                <p className="text-xs text-slate-400 mb-2">{mall.city}, {mall.state}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Stores</span><span className="font-medium text-slate-700">{mallStores.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Manager</span><span className="font-medium text-slate-700">{mgr ? `${mgr.first_name} ${mgr.last_name}` : '—'}</span></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TenantsView() {
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

function BidsView() {
  const [refresh, setRefresh] = useState(0);
  const [finalizeEvent, setFinalizeEvent] = useState(null);
  const [allocation, setAllocation] = useState('');

  const handleFinalize = async () => {
    const event = bidEvents.find(be => be.event_id === finalizeEvent.event_id);
    if (event) {
      event.status = 'finalized';
      event.final_allocation = allocation;
    }
    setFinalizeEvent(null);
    setAllocation('');
    setRefresh(r => r + 1);
  };

  return (
    <div key={refresh}>
      <PageHeader title="Bid Events Overview" subtitle="All active and past bidding events across malls" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bidEvents.map(event => {
          const store = getStoreById(event.store_id);
          const mall = store ? getMallById(store.mall_id) : null;
          const eventBids = getBidsByEvent(event.event_id);
          const winning = getWinningBid(event.event_id);
          return (
            <div key={event.event_id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{store?.store_name}</h3>
                  <p className="text-xs text-slate-400">{mall?.city}, {mall?.state} · {event.start_date} → {event.end_date}</p>
                </div>
                <Badge variant={event.status === 'open' ? 'success' : 'neutral'}>{event.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Total Bids</p>
                  <p className="font-semibold text-slate-800 text-sm">{eventBids.length}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Highest Bid</p>
                  <p className="font-semibold text-green-600 text-sm">${(winning?.bid_amount || 0).toLocaleString()}</p>
                </div>
              </div>
              {winning && (
                <div className="p-2.5 rounded-lg bg-green-50 mb-3 flex items-center gap-2">
                  <Trophy size={14} className="text-green-600" />
                  <span className="text-sm text-slate-700">Leading: <span className="font-medium">{winning.bidder_name}</span> — ${winning.bid_amount.toLocaleString()}</span>
                </div>
              )}
              {event.status === 'open' && (
                <button onClick={() => setFinalizeEvent(event)} className="btn-secondary w-full text-sm">
                  <Lock size={14} /> Approve & Finalize
                </button>
              )}
              {event.status === 'finalized' && event.final_allocation && (
                <div className="p-2.5 rounded-lg bg-slate-50 text-sm text-slate-600">
                  {event.final_allocation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={!!finalizeEvent} onClose={() => setFinalizeEvent(null)} title="Finalize Bid Event" size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Finalize bidding for <span className="font-medium text-slate-800">{finalizeEvent && getStoreById(finalizeEvent.store_id)?.store_name}</span>
          </p>
          {finalizeEvent && getWinningBid(finalizeEvent.event_id) && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-slate-600">Winning Bid</p>
              <p className="font-bold text-slate-900">{getWinningBid(finalizeEvent.event_id).bidder_name} — ${getWinningBid(finalizeEvent.event_id).bid_amount.toLocaleString()}</p>
            </div>
          )}
          <div>
            <label className="label">Final Allocation Note</label>
            <input className="input" value={allocation} onChange={e => setAllocation(e.target.value)} placeholder="e.g. Awarded to Taylor Quinn" />
          </div>
          <button onClick={handleFinalize} className="btn-primary w-full">Finalize Event</button>
        </div>
      </Modal>
    </div>
  );
}

function AnalyticsView() {
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

function CreateManagerView() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone_number: '', mall_id: 'm1' });
  const [created, setCreated] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const handleCreate = async () => {
    // REAL API: await apiCreateManager(form);
    mgrs.push({
      ...form,
      manager_id: `mm${Date.now()}`,
      date_joined: new Date().toISOString().split('T')[0],
    });
    setCreated(true);
    setForm({ first_name: '', last_name: '', email: '', phone_number: '', mall_id: 'm1' });
    setRefresh(r => r + 1);
    setTimeout(() => setCreated(false), 4000);
  };

  return (
    <div key={refresh}>
      <PageHeader title="Create New Manager" subtitle="Add a new Mall Manager account with admin powers" />
      {created && (
        <div className="card p-3 mb-4 bg-green-50 border-green-200 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-600" />
          <span className="text-sm text-green-700">Manager account created successfully!</span>
        </div>
      )}
      <div className="card p-5 max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input className="input" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} />
          </div>
          <div>
            <label className="label">Assign to Mall</label>
            <select className="input" value={form.mall_id} onChange={e => setForm({ ...form, mall_id: e.target.value })}>
              {malls.map(m => <option key={m.mall_id} value={m.mall_id}>{m.city === 'New York' ? 'Heritage Plaza' : m.city === 'San Jose' ? 'Tech Park Mall' : 'Lakeshore Mall'} — {m.city}, {m.state}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} className="btn-primary w-full"><Plus size={16} /> Create Manager Account</button>
        </div>
      </div>

      <h3 className="font-semibold text-slate-900 mt-8 mb-3">Existing Managers</h3>
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'name', label: 'Name', render: m => <span className="font-medium text-slate-800">{m.first_name} {m.last_name}</span> },
            { key: 'email', label: 'Email', render: m => <span className="text-slate-600">{m.email}</span> },
            { key: 'mall', label: 'Mall', render: m => { const mall = getMallById(m.mall_id); return <span className="text-slate-600">{mall?.city}</span>; }},
            { key: 'joined', label: 'Joined', render: m => <span className="text-slate-500">{m.date_joined}</span> },
          ]}
          rows={mallManagers}
          emptyMessage="No managers found."
        />
      </div>
    </div>
  );
}

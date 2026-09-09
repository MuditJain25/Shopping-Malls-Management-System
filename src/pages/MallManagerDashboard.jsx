import { useState, useEffect } from 'react';
import {
  Home, Users, Store, FileText, Gavel,
  Plus, Building2, Phone, Mail, Calendar, DollarSign,
  CheckCircle2, XCircle, Lock, Unlock, Trophy, Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';
import { PageHeader, StatCard, DataTable, Badge, EmptyState, LoadingSpinner } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import {
  mallManagers, getStoresByMall, getEmployeesByMall, tenants,
  getMallById, getBidEventsByMall, getBidsByEvent, getWinningBid,
  bidEvents, stores, employees, revenueInfo, transactions, getStoreById
} from '@/lib/mockData.js';
import {
  apiGetEmployeesByMall, apiAddEmployee, apiFinalizeBidEvent
} from '@/lib/api.js';

export default function MallManagerDashboard() {
  const { user } = useAuth();
  const { route } = useRouter();

  if (!user) return <LoadingSpinner />;

  const manager = mallManagers.find(mm => mm.manager_id === user.profileId);
  const mallId = manager?.mall_id || 'm1';
  const pageKey = route.split('/').pop() || 'mall-manager';

  if (pageKey === 'mall-manager') return <Overview mallId={mallId} manager={manager} />;
  if (pageKey === 'employees') return <EmployeesView mallId={mallId} />;
  if (pageKey === 'stores') return <StoresView mallId={mallId} />;
  if (pageKey === 'tenants') return <TenantsView mallId={mallId} />;
  if (pageKey === 'agreements') return <AgreementsView mallId={mallId} />;
  if (pageKey === 'bidding') return <BiddingView mallId={mallId} />;
  return <Overview mallId={mallId} manager={manager} />;
}

// ════════════════════════════════════════════════════════════════
function Overview({ mallId, manager }) {
  const mall = getMallById(mallId);
  const mallStores = getStoresByMall(mallId);
  const mallEmps = getEmployeesByMall(mallId);
  const directEmps = mallEmps.filter(e => e.store_id === null);
  const storeEmps = mallEmps.filter(e => e.store_id !== null);
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

// ════════════════════════════════════════════════════════════════
function EmployeesView({ mallId }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newEmp, setNewEmp] = useState({ first_name: '', last_name: '', email: '', base_salary: '', current_designation: '', phone_number: '' });
  const [refresh, setRefresh] = useState(0);
  const [empToRemove, setEmpToRemove] = useState(null);

  const mallEmps = getEmployeesByMall(mallId);
  const directEmps = mallEmps.filter(e => e.store_id === null);

  const handleAdd = async () => {
    employees.push({
      ...newEmp,
      employee_id: `e${Date.now()}`,
      store_id: null,
      mall_id: mallId,
      date_of_joining: new Date().toISOString().split('T')[0],
      base_salary: parseFloat(newEmp.base_salary) || 0,
    });
    setShowAdd(false);
    setNewEmp({ first_name: '', last_name: '', email: '', base_salary: '', current_designation: '', phone_number: '' });
    setRefresh(r => r + 1);
  };

  const handleRemove = () => {
    const index = employees.findIndex(e => e.employee_id === empToRemove.employee_id);
    if (index >= 0) employees.splice(index, 1);
    setEmpToRemove(null);
    setRefresh(r => r + 1);
  };

  return (
    <div key={refresh}>
      <PageHeader
        title="Employee Management"
        subtitle="Direct mall employees and store staff"
        action={<button onClick={() => setShowAdd(true)} className="btn-primary text-sm"><Plus size={16} /> Add Direct Employee</button>}
      />

      <h3 className="font-semibold text-slate-900 mb-3">Direct Mall Employees</h3>
      <div className="card overflow-hidden mb-8">
        <DataTable
          columns={[
            { key: 'name', label: 'Name', render: e => <span className="font-medium text-slate-800">{e.first_name} {e.last_name}</span> },
            { key: 'designation', label: 'Designation', render: e => <Badge variant="brand">{e.current_designation}</Badge> },
            { key: 'email', label: 'Email', render: e => <span className="text-slate-600">{e.email}</span> },
            { key: 'phone', label: 'Phone', render: e => <span className="text-slate-600">{e.phone_number}</span> },
            { key: 'salary', label: 'Salary', render: e => <span className="font-medium text-slate-800">${e.base_salary.toLocaleString()}</span> },
            { key: 'actions', label: '', render: e => <button onClick={() => setEmpToRemove(e)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Remove employee"><Trash2 size={14} /></button> },
          ]}
          rows={directEmps}
          emptyMessage="No direct mall employees yet."
        />
      </div>

      <h3 className="font-semibold text-slate-900 mb-3">Store Employees</h3>
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'name', label: 'Name', render: e => <span className="font-medium text-slate-800">{e.first_name} {e.last_name}</span> },
            { key: 'store', label: 'Store', render: e => { const s = getStoreById(e.store_id); return <span className="text-slate-600">{s?.store_name || '—'}</span>; } },
            { key: 'designation', label: 'Designation', render: e => <Badge variant="neutral">{e.current_designation}</Badge> },
            { key: 'email', label: 'Email', render: e => <span className="text-slate-600">{e.email}</span> },
            { key: 'salary', label: 'Salary', render: e => <span className="font-medium text-slate-800">${e.base_salary.toLocaleString()}</span> },
            { key: 'actions', label: '', render: e => <button onClick={() => setEmpToRemove(e)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Remove employee"><Trash2 size={14} /></button> },
          ]}
          rows={mallEmps.filter(e => e.store_id !== null)}
          emptyMessage="No store employees in this mall."
        />
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Direct Mall Employee" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input className="input" value={newEmp.first_name} onChange={e => setNewEmp({ ...newEmp, first_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" value={newEmp.last_name} onChange={e => setNewEmp({ ...newEmp, last_name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input" value={newEmp.phone_number} onChange={e => setNewEmp({ ...newEmp, phone_number: e.target.value })} />
          </div>
          <div>
            <label className="label">Designation</label>
            <input className="input" value={newEmp.current_designation} onChange={e => setNewEmp({ ...newEmp, current_designation: e.target.value })} placeholder="e.g. Security, Maintenance" />
          </div>
          <div>
            <label className="label">Base Salary ($)</label>
            <input type="number" className="input" value={newEmp.base_salary} onChange={e => setNewEmp({ ...newEmp, base_salary: e.target.value })} />
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">Add Employee</button>
        </div>
      </Modal>

      <Modal open={!!empToRemove} onClose={() => setEmpToRemove(null)} title="Remove Employee" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Remove <span className="font-medium text-slate-800">{empToRemove?.first_name} {empToRemove?.last_name}</span> from this mall?</p>
          <div className="flex gap-3">
            <button onClick={() => setEmpToRemove(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleRemove} className="btn bg-red-600 text-white hover:bg-red-700 flex-1 px-4 py-2 text-sm font-semibold rounded-lg">Remove</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
function TenantsView({ mallId }) {
  const [showAdd, setShowAdd] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [tenantToRemove, setTenantToRemove] = useState(null);
  const [form, setForm] = useState({ business_name: '', business_type: '', email: '', phone_number: '', store_id: '' });
  const mallStores = getStoresByMall(mallId);
  const mallTenants = tenants.filter(t => t.store_ids.some(id => mallStores.some(store => store.store_id === id)));

  const handleCreate = () => {
    const tenantId = `t${Date.now()}`;
    tenants.push({
      tenant_id: tenantId,
      business_name: form.business_name,
      business_type: form.business_type,
      email: form.email,
      phone_number: form.phone_number,
      date_registered: new Date().toISOString().split('T')[0],
      store_ids: form.store_id ? [form.store_id] : [],
    });
    if (form.store_id) {
      const store = stores.find(s => s.store_id === form.store_id);
      if (store) store.status = 'occupied';
    }
    setForm({ business_name: '', business_type: '', email: '', phone_number: '', store_id: '' });
    setShowAdd(false);
    setRefresh(r => r + 1);
  };

  const handleRemove = () => {
    const index = tenants.findIndex(t => t.tenant_id === tenantToRemove.tenant_id);
    if (index >= 0) tenants.splice(index, 1);
    tenantToRemove.store_ids.forEach(storeId => {
      const store = stores.find(s => s.store_id === storeId);
      if (store) store.status = 'available';
    });
    setTenantToRemove(null);
    setRefresh(r => r + 1);
  };

  return (
    <div key={refresh}>
      <PageHeader title="Tenant Management" subtitle="Create and manage tenants in this mall" action={<button onClick={() => setShowAdd(true)} className="btn-primary text-sm"><Plus size={16} /> Add Tenant</button>} />
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'business_name', label: 'Business', render: t => <span className="font-medium text-slate-800">{t.business_name}</span> },
            { key: 'business_type', label: 'Type', render: t => <Badge variant="brand">{t.business_type}</Badge> },
            { key: 'stores', label: 'Stores', render: t => <span className="text-slate-600">{t.store_ids.length}</span> },
            { key: 'email', label: 'Email', render: t => <span className="text-slate-600">{t.email}</span> },
            { key: 'actions', label: '', render: t => <button onClick={() => setTenantToRemove(t)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Remove tenant"><Trash2 size={14} /></button> },
          ]}
          rows={mallTenants}
          emptyMessage="No tenants found in this mall."
        />
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Tenant" size="md">
        <div className="space-y-4">
          <div><label className="label">Business Name</label><input className="input" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} /></div>
          <div><label className="label">Business Type</label><input className="input" value={form.business_type} onChange={e => setForm({ ...form, business_type: e.target.value })} placeholder="e.g. Fashion Retail" /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Phone Number</label><input className="input" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} /></div>
          <div>
            <label className="label">Assign Store</label>
            <select className="input" value={form.store_id} onChange={e => setForm({ ...form, store_id: e.target.value })}>
              <option value="">No store yet</option>
              {mallStores.filter(s => s.status === 'available').map(store => <option key={store.store_id} value={store.store_id}>{store.store_name} — Shop {store.shop_number}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} className="btn-primary w-full">Create Tenant</button>
        </div>
      </Modal>

      <Modal open={!!tenantToRemove} onClose={() => setTenantToRemove(null)} title="Remove Tenant" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Remove <span className="font-medium text-slate-800">{tenantToRemove?.business_name}</span> from this mall?</p>
          <div className="flex gap-3">
            <button onClick={() => setTenantToRemove(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleRemove} className="btn bg-red-600 text-white hover:bg-red-700 flex-1 px-4 py-2 text-sm font-semibold rounded-lg">Remove</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
function StoresView({ mallId }) {
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

// ════════════════════════════════════════════════════════════════
function AgreementsView({ mallId }) {
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

// ════════════════════════════════════════════════════════════════
function BiddingView({ mallId }) {
  const [refresh, setRefresh] = useState(0);
  const [finalizeEvent, setFinalizeEvent] = useState(null);
  const [allocation, setAllocation] = useState('');

  const events = getBidEventsByMall(mallId);

  const handleFinalize = async () => {
    // REAL API: await apiFinalizeBidEvent(finalizeEvent.event_id, allocation);
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
      <PageHeader title="Bidding Control" subtitle="Open, close, and manage bidding events for mall properties" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map(event => {
          const store = getStoreById(event.store_id);
          const eventBids = getBidsByEvent(event.event_id);
          const winning = getWinningBid(event.event_id);
          return (
            <div key={event.event_id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{store?.store_name}</h3>
                  <p className="text-xs text-slate-400">Shop {store?.shop_number} · {store?.area_sqft} sqft</p>
                </div>
                <Badge variant={event.status === 'open' ? 'success' : event.status === 'finalized' ? 'neutral' : 'warning'}>{event.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Min Bid</p>
                  <p className="font-semibold text-slate-800 text-sm">${event.minimum_bid_amount.toLocaleString()}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Min Increment</p>
                  <p className="font-semibold text-slate-800 text-sm">${event.minimum_bid_increment.toLocaleString()}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Total Bids</p>
                  <p className="font-semibold text-slate-800 text-sm">{eventBids.length}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Highest Bid</p>
                  <p className="font-semibold text-green-600 text-sm">${(winning?.bid_amount || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
                {eventBids.map(bid => (
                  <div key={bid.bid_id} className={`flex items-center justify-between p-2 rounded-lg text-sm ${bid.status === 'winning' ? 'bg-green-50' : 'bg-slate-50'}`}>
                    <span className="text-slate-700">{bid.bidder_name}</span>
                    <span className="font-medium text-slate-900">${bid.bid_amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {event.status === 'open' && (
                <button onClick={() => setFinalizeEvent(event)} className="btn-secondary w-full text-sm">
                  <Lock size={14} /> Close & Finalize
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
            Close the bidding event for <span className="font-medium text-slate-800">{finalizeEvent && getStoreById(finalizeEvent.store_id)?.store_name}</span> and record the winning allocation.
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

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader, DataTable, Badge, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { apiGetTenants, apiGetMalls, apiGetStores, apiCreateTenant, apiDeleteTenant } from '@/lib/api.js';

const EMPTY_FORM = { business_name: '', business_type: '', email: '', phone_number: '', mall_id: '', store_id: '' };

export default function TenantsView() {
  const [tenants, setTenants] = useState(null);
  const [malls, setMalls] = useState([]);
  const [stores, setStores] = useState([]);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [tenantToRemove, setTenantToRemove] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([apiGetTenants(), apiGetMalls().catch(() => []), apiGetStores().catch(() => [])])
      .then(([allTenants, allMalls, allStores]) => {
        if (!cancelled) { setTenants(allTenants); setMalls(allMalls); setStores(allStores); }
      })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [refresh]);

  const mallById = (id) => malls.find(m => m.mall_id === id);
  const storeById = (id) => stores.find(s => s.store_id === id);

  const handleCreate = async () => {
    setActionError(null);
    try {
      await apiCreateTenant({
        business_name: form.business_name,
        business_type: form.business_type,
        email: form.email,
        phone_number: form.phone_number,
        store_ids: form.store_id ? [Number(form.store_id)] : [],
      });
      setForm(EMPTY_FORM);
      setShowAdd(false);
      setRefresh(r => r + 1);
    } catch (e) {
      setActionError(e.message);
    }
  };

  const handleRemove = async () => {
    setActionError(null);
    try {
      await apiDeleteTenant(tenantToRemove.tenant_id);
      setTenantToRemove(null);
      setRefresh(r => r + 1);
    } catch (e) {
      setActionError(e.message);
      setTenantToRemove(null);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!tenants) return <LoadingSpinner label="Loading tenants..." />;

  const availableStores = form.mall_id ? stores.filter(s => s.mall_id === Number(form.mall_id) && s.status === 'available') : stores.filter(s => s.status === 'available');

  return (
    <div>
      <PageHeader title="All Tenants" subtitle="All tenants across all malls" action={<button onClick={() => setShowAdd(true)} className="btn-primary text-sm"><Plus size={16} /> Add Tenant</button>} />
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'business_name', label: 'Business', render: t => <span className="font-medium text-slate-800">{t.business_name}</span> },
            { key: 'business_type', label: 'Type', render: t => <Badge variant="brand">{t.business_type}</Badge> },
            { key: 'mall', label: 'Mall', render: t => {
              const st = (t.store_ids || []).map(storeById).find(Boolean);
              const m = st ? mallById(st.mall_id) : null;
              return <span className="text-slate-600">{m ? (m.mall_name || `${m.city}, ${m.state}`) : '—'}</span>;
            }},
            { key: 'stores', label: 'Store', render: t => {
              const st = (t.store_ids || []).map(storeById).find(Boolean);
              return <span className="text-slate-600">{st ? `${st.store_name} · Shop ${st.shop_number}` : `${(t.store_ids || []).length} store(s)`}</span>;
            }},
            { key: 'email', label: 'Email', render: t => <span className="text-slate-600">{t.email}</span> },
            { key: 'phone', label: 'Phone', render: t => <span className="text-slate-600">{t.phone_number}</span> },
            { key: 'registered', label: 'Registered', render: t => <span className="text-slate-500">{t.date_registered}</span> },
            { key: 'actions', label: '', render: t => <button onClick={() => setTenantToRemove(t)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Remove tenant"><Trash2 size={14} /></button> },
          ]}
          rows={tenants}
          emptyMessage="No tenants found."
        />
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Tenant" size="md">
        <div className="space-y-4">
          <div><label className="label">Business Name</label><input className="input" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} /></div>
          <div><label className="label">Business Type</label><input className="input" value={form.business_type} onChange={e => setForm({ ...form, business_type: e.target.value })} placeholder="e.g. Fashion Retail" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Phone Number</label><input className="input" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} /></div>
          </div>
          <div>
            <label className="label">Mall</label>
            <select className="input" value={form.mall_id} onChange={e => setForm({ ...form, mall_id: e.target.value, store_id: '' })}>
              <option value="">Any / Unassigned</option>
              {malls.map(m => <option key={m.mall_id} value={m.mall_id}>{m.mall_name || `${m.city}, ${m.state}`}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assign Store</label>
            <select className="input" value={form.store_id} onChange={e => setForm({ ...form, store_id: e.target.value })}>
              <option value="">No store yet</option>
              {availableStores.map(store => <option key={store.store_id} value={store.store_id}>{store.store_name} — Shop {store.shop_number} ({mallById(store.mall_id)?.mall_name || store.mall_id})</option>)}
            </select>
          </div>
          {actionError && <ErrorState message={actionError} />}
          <button onClick={handleCreate} className="btn-primary w-full">Create Tenant</button>
        </div>
      </Modal>

      <Modal open={!!tenantToRemove} onClose={() => setTenantToRemove(null)} title="Remove Tenant" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Remove <span className="font-medium text-slate-800">{tenantToRemove?.business_name}</span>?</p>
          {actionError && <ErrorState message={actionError} />}
          <div className="flex gap-3">
            <button onClick={() => setTenantToRemove(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleRemove} className="btn bg-red-600 text-white hover:bg-red-700 flex-1 px-4 py-2 text-sm font-semibold rounded-lg">Remove</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

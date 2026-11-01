import { useState, useEffect } from 'react';
import { Plus, Trash2, Link2 } from 'lucide-react';
import { PageHeader, Badge, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { apiGetStoresByMall, apiGetEmployeesByMall, apiGetTenants, apiCreateStore, apiDeleteStore, apiLinkTenantStore, apiUnlinkTenantStore } from '@/lib/api.js';

const EMPTY_FORM = { store_name: '', shop_number: '', floor: '', area_sqft: '', listing_media: '' };

export default function StoresView({ mallId }) {
  const [stores, setStores] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [allTenants, setAllTenants] = useState([]);
  const [tenantStoreId, setTenantStoreId] = useState(null);
  const [linkTenantId, setLinkTenantId] = useState('');
  const [linkError, setLinkError] = useState(null);
  const [linkBusy, setLinkBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([
      apiGetStoresByMall(mallId),
      apiGetEmployeesByMall(mallId),
      apiGetTenants(mallId),
      apiGetTenants(),
    ])
      .then(([mallStores, mallEmps, mallTenants, everyTenant]) => {
        if (!cancelled) { setStores(mallStores); setEmployees(mallEmps); setTenants(mallTenants); setAllTenants(everyTenant); }
      })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [mallId, refresh]);

  const handleCreate = async () => {
    setActionError(null);
    try {
      await apiCreateStore({
        store_name: form.store_name,
        shop_number: form.shop_number,
        floor: Number(form.floor) || 0,
        area_sqft: Number(form.area_sqft) || 0,
        listing_media: form.listing_media,
        status: 'available',
        mall_id: mallId,
      });
      setForm(EMPTY_FORM);
      setShowAdd(false);
      setRefresh(r => r + 1);
    } catch (e) {
      setActionError(e.message);
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    try {
      await apiDeleteStore(storeToDelete.store_id);
      setStoreToDelete(null);
      setRefresh(r => r + 1);
    } catch (e) {
      setActionError(e.message);
      setStoreToDelete(null);
    }
  };

  const runLink = async (call) => {
    setLinkError(null);
    setLinkBusy(true);
    try {
      await call();
      setLinkTenantId('');
      setRefresh(r => r + 1);
    } catch (e) {
      setLinkError(e.message);
    } finally {
      setLinkBusy(false);
    }
  };

  const closeTenants = () => { setTenantStoreId(null); setLinkTenantId(''); setLinkError(null); };

  const managedStore = stores?.find(s => s.store_id === tenantStoreId);
  const linkedTenants = allTenants.filter(t => t.store_ids.includes(tenantStoreId));
  const linkableTenants = allTenants.filter(t => !t.store_ids.includes(tenantStoreId));

  if (error) return <ErrorState message={error} />;
  if (!stores) return <LoadingSpinner label="Loading stores..." />;

  return (
    <div>
      <PageHeader
        title="Stores"
        subtitle="All stores in this mall"
        action={<button onClick={() => setShowAdd(true)} className="btn-primary text-sm"><Plus size={16} /> Add Store</button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map(store => {
          const storeTenants = tenants.filter(t => t.store_ids.includes(store.store_id));
          const empCount = employees.filter(e => e.store_id === store.store_id).length;
          return (
            <div key={store.store_id} className="card overflow-hidden">
              <img src={store.listing_media[0]} alt={store.store_name} className="w-full h-28 object-cover" />
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900 text-sm">{store.store_name}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={store.status === 'occupied' ? 'success' : 'warning'}>{store.status}</Badge>
                    <button onClick={() => setStoreToDelete(store)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Delete store"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-3">Shop {store.shop_number} · Floor {store.floor} · {store.area_sqft} sqft</p>
                <div className="space-y-1 text-sm">
                  {storeTenants.length > 0 && (
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">{storeTenants.length > 1 ? 'Tenants' : 'Tenant'}</span>
                      <span className="font-medium text-slate-700 text-right">{storeTenants.map(t => t.business_name).join(', ')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Employees</span>
                    <span className="font-medium text-slate-700">{empCount}</span>
                  </div>
                </div>
                <button onClick={() => setTenantStoreId(store.store_id)} className="btn-secondary text-xs w-full mt-3"><Link2 size={14} /> Manage tenants</button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Store" size="md">
        <div className="space-y-4">
          <div><label className="label">Store Name</label><input className="input" value={form.store_name} onChange={e => setForm({ ...form, store_name: e.target.value })} placeholder="e.g. Skyline Fashion" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Shop No.</label><input className="input" value={form.shop_number} onChange={e => setForm({ ...form, shop_number: e.target.value })} placeholder="G-12" /></div>
            <div><label className="label">Floor</label><input type="number" className="input" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} /></div>
            <div><label className="label">Area (sqft)</label><input type="number" className="input" value={form.area_sqft} onChange={e => setForm({ ...form, area_sqft: e.target.value })} /></div>
          </div>
          <div><label className="label">Image URL</label><input className="input" value={form.listing_media} onChange={e => setForm({ ...form, listing_media: e.target.value })} placeholder="https://…" /></div>
          {actionError && <ErrorState message={actionError} />}
          <button onClick={handleCreate} className="btn-primary w-full">Create Store</button>
        </div>
      </Modal>

      <Modal open={tenantStoreId !== null} onClose={closeTenants} title={`Tenants — ${managedStore?.store_name ?? ''}`} size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Linked tenants</label>
            {linkedTenants.length === 0 && <p className="text-sm text-slate-400">No tenants linked.</p>}
            <div className="space-y-2">
              {linkedTenants.map(t => (
                <div key={t.tenant_id} className="flex items-center justify-between text-sm">
                  <span><span className="font-medium text-slate-700">{t.business_name}</span> <span className="text-xs text-slate-400">{t.business_type}</span></span>
                  <button disabled={linkBusy} onClick={() => runLink(() => apiUnlinkTenantStore(t.tenant_id, tenantStoreId))} className="btn-secondary text-xs">Unlink</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Link a tenant</label>
            <div className="flex gap-2">
              <select className="input" value={linkTenantId} onChange={e => setLinkTenantId(e.target.value)}>
                <option value="">Select tenant…</option>
                {linkableTenants.map(t => <option key={t.tenant_id} value={t.tenant_id}>{t.business_name}</option>)}
              </select>
              <button disabled={!linkTenantId || linkBusy} onClick={() => runLink(() => apiLinkTenantStore(linkTenantId, tenantStoreId))} className="btn-primary text-sm">Link</button>
            </div>
          </div>
          {linkError && <ErrorState message={linkError} />}
        </div>
      </Modal>

      <Modal open={!!storeToDelete} onClose={() => setStoreToDelete(null)} title="Delete Store" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Delete <span className="font-medium text-slate-800">{storeToDelete?.store_name}</span> from this mall?</p>
          {actionError && <ErrorState message={actionError} />}
          <div className="flex gap-3">
            <button onClick={() => setStoreToDelete(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDelete} className="btn bg-red-600 text-white hover:bg-red-700 flex-1 px-4 py-2 text-sm font-semibold rounded-lg">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

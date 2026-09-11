import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader, DataTable, Badge } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { tenants, stores, getStoresByMall } from '@/lib/mockData.js';

export default function TenantsView({ mallId }) {
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

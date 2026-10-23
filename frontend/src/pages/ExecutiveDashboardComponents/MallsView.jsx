import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, DataTable, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { apiGetMalls, apiGetManagers, apiGetStores, apiCreateMall } from '@/lib/api.js';

const EMPTY_MALL = { city: '', state: '', street: '', pincode: '', mall_area_sqft: '', opening_date: '', latitude: '', longitude: '', image_url: '', description: '' };

export default function MallsView() {
  const [malls, setMalls] = useState(null);
  const [managers, setManagers] = useState([]);
  const [stores, setStores] = useState([]);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_MALL);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([apiGetMalls(), apiGetManagers().catch(() => []), apiGetStores().catch(() => [])])
      .then(([allMalls, allMgrs, allStores]) => {
        if (!cancelled) { setMalls(allMalls); setManagers(allMgrs); setStores(allStores); }
      })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [refresh]);

  const handleCreate = async () => {
    setActionError(null);
    try {
      await apiCreateMall({
        city: form.city,
        state: form.state,
        street: form.street,
        pincode: form.pincode,
        mall_area_sqft: form.mall_area_sqft ? Number(form.mall_area_sqft) : null,
        opening_date: form.opening_date || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        image_url: form.image_url || null,
        description: form.description || null,
      });
      setForm(EMPTY_MALL);
      setShowAdd(false);
      setRefresh(r => r + 1);
    } catch (e) {
      setActionError(e.message);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!malls) return <LoadingSpinner label="Loading malls..." />;

  const mgrByMall = (id) => managers.find(m => m.mall_id === id);
  const storesByMallCount = (id) => stores.filter(s => s.mall_id === id).length;

  return (
    <div>
      <PageHeader title="Malls & Managers" subtitle="All malls and their assigned Mall Managers" action={<button onClick={() => setShowAdd(true)} className="btn-primary text-sm"><Plus size={16} /> Add Mall</button>} />
      <div className="card overflow-hidden mb-8">
        <DataTable
          columns={[
            { key: 'mall', label: 'Mall', render: m => <span className="font-medium text-slate-800">{m.mall_name || m.street || `${m.city}, ${m.state}`}</span> },
            { key: 'location', label: 'Location', render: m => <span className="text-slate-600">{m.city}{m.state ? `, ${m.state}` : ''}</span> },
            { key: 'manager', label: 'Manager', render: m => { const mgr = mgrByMall(m.mall_id); return <span className="font-medium text-slate-800">{mgr ? `${mgr.first_name} ${mgr.last_name}` : '—'}</span>; } },
            { key: 'email', label: 'Manager Email', render: m => { const mgr = mgrByMall(m.mall_id); return <span className="text-slate-600">{mgr?.email || '—'}</span>; } },
            { key: 'phone', label: 'Manager Phone', render: m => { const mgr = mgrByMall(m.mall_id); return <span className="text-slate-600">{mgr?.phone_number || mgr?.phone || '—'}</span>; } },
            { key: 'stores', label: 'Stores', render: m => <span className="text-slate-600">{storesByMallCount(m.mall_id)}</span> },
          ]}
          rows={malls}
          emptyMessage="No malls found."
        />
      </div>

      <h3 className="font-semibold text-slate-900 mb-3">All Malls</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {malls.map(mall => {
          const mgr = mgrByMall(mall.mall_id);
          return (
            <div key={mall.mall_id} className="card overflow-hidden">
              <img src={mall.imageUrl || 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800'} alt={mall.city} className="w-full h-32 object-cover" />
              <div className="p-4">
                <h4 className="font-medium text-slate-900">{mall.mall_name || mall.street || `${mall.city}, ${mall.state}`}</h4>
                <p className="text-xs text-slate-400 mb-2">{mall.city}{mall.state ? `, ${mall.state}` : ''}{mall.pincode ? ` · ${mall.pincode}` : ''}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Stores</span><span className="font-medium text-slate-700">{storesByMallCount(mall.mall_id)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Manager</span><span className="font-medium text-slate-700">{mgr ? `${mgr.first_name} ${mgr.last_name}` : '—'}</span></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Mall" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">City</label><input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="label">State</label><input className="input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Street</label><input className="input" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} /></div>
            <div><label className="label">Pincode</label><input className="input" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Area (sqft)</label><input type="number" className="input" value={form.mall_area_sqft} onChange={e => setForm({ ...form, mall_area_sqft: e.target.value })} /></div>
            <div><label className="label">Opening Date</label><input type="date" className="input" value={form.opening_date} onChange={e => setForm({ ...form, opening_date: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Latitude</label><input type="number" step="any" className="input" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} /></div>
            <div><label className="label">Longitude</label><input type="number" step="any" className="input" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} /></div>
          </div>
          <div><label className="label">Image URL</label><input className="input" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          {actionError && <ErrorState message={actionError} />}
          <button onClick={handleCreate} className="btn-primary w-full">Create Mall</button>
        </div>
      </Modal>
    </div>
  );
}

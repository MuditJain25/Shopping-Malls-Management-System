import { useState } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { PageHeader, DataTable } from '@/components/ui/index.jsx';
import { malls, mallManagers, getMallById, mallManagers as mgrs } from '@/lib/mockData.js';

export default function CreateManagerView() {
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

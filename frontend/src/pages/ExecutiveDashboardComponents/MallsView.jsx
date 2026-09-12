import { PageHeader, DataTable } from '@/components/ui/index.jsx';
import { malls, mallManagers, getMallById, getStoresByMall } from '@/lib/mockData.js';

export default function MallsView() {
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

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader, DataTable, Badge } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { getEmployeesByMall, employees, getStoreById } from '@/lib/mockData.js';

export default function EmployeesView({ mallId }) {
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

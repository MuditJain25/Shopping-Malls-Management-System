import { useState } from 'react';
import { Plus, Trash2, Clock, Calendar } from 'lucide-react';
import { PageHeader, DataTable, Badge, EmptyState } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import {
  getEmployeesByStore, employees, attendanceRecords
} from '@/lib/mockData.js';

export default function EmployeesView({ stores }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedStore, setSelectedStore] = useState(stores[0]?.store_id || '');
  const [newEmp, setNewEmp] = useState({ first_name: '', last_name: '', email: '', base_salary: '', current_designation: '', phone_number: '' });
  const [refresh, setRefresh] = useState(0);
  const [empToRemove, setEmpToRemove] = useState(null);
  const [empForAttendance, setEmpForAttendance] = useState(null);

  const store = stores.find(s => s.store_id === selectedStore) || stores[0];
  const emps = store ? getEmployeesByStore(store.store_id) : [];

  const handleAdd = async () => {
    employees.push({
      ...newEmp,
      employee_id: `e${Date.now()}`,
      store_id: store.store_id,
      mall_id: store.mall_id,
      date_of_joining: new Date().toISOString().split('T')[0],
      base_salary: parseFloat(newEmp.base_salary) || 0,
    });
    setShowAdd(false);
    setNewEmp({ first_name: '', last_name: '', email: '', base_salary: '', current_designation: '', phone_number: '' });
    setRefresh(r => r + 1);
  };

  const handleRemove = () => {
    const idx = employees.findIndex(e => e.employee_id === empToRemove.employee_id);
    if (idx >= 0) employees.splice(idx, 1);
    setEmpToRemove(null);
    setRefresh(r => r + 1);
  };

  if (!store) return <EmptyState title="No stores" message="You don't have any stores yet." />;

  return (
    <div key={refresh}>
      <PageHeader
        title="Employees"
        subtitle="Track employees under your stores"
        action={<button onClick={() => setShowAdd(true)} className="btn-primary text-sm"><Plus size={16} /> Add Employee</button>}
      />
      {stores.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {stores.map(s => (
            <button
              key={s.store_id}
              onClick={() => setSelectedStore(s.store_id)}
              className={`px-3 py-1.5 rounded-lg text-sm ${selectedStore === s.store_id ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
            >
              {s.store_name}
            </button>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'name', label: 'Name', render: e => <button onClick={() => setEmpForAttendance(e)} className="font-medium text-brand-700 hover:text-brand-800 hover:underline">{e.first_name} {e.last_name}</button> },
            { key: 'designation', label: 'Designation', render: e => <Badge variant="brand">{e.current_designation}</Badge> },
            { key: 'email', label: 'Email', render: e => <span className="text-slate-600">{e.email}</span> },
            { key: 'phone', label: 'Phone', render: e => <span className="text-slate-600">{e.phone_number}</span> },
            { key: 'salary', label: 'Base Salary', render: e => <span className="font-medium text-slate-800">${e.base_salary.toLocaleString()}</span> },
            { key: 'joined', label: 'Joined', render: e => <span className="text-slate-500">{e.date_of_joining}</span> },
            { key: 'actions', label: '', render: e => (
              <button onClick={() => setEmpToRemove(e)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Remove employee">
                <Trash2 size={14} />
              </button>
            )},
          ]}
          rows={emps}
          emptyMessage="No employees hired for this store yet."
        />
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Employee" size="md">
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
            <input className="input" value={newEmp.current_designation} onChange={e => setNewEmp({ ...newEmp, current_designation: e.target.value })} placeholder="e.g. Sales Associate" />
          </div>
          <div>
            <label className="label">Base Salary ($)</label>
            <input type="number" className="input" value={newEmp.base_salary} onChange={e => setNewEmp({ ...newEmp, base_salary: e.target.value })} />
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">Add Employee</button>
        </div>
      </Modal>

      <Modal open={!!empForAttendance} onClose={() => setEmpForAttendance(null)} title={empForAttendance ? `Attendance — ${empForAttendance.first_name} ${empForAttendance.last_name}` : 'Attendance'} size="md">
        <EmployeeAttendanceRecords employeeId={empForAttendance?.employee_id} />
      </Modal>

      <Modal open={!!empToRemove} onClose={() => setEmpToRemove(null)} title="Remove Employee" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to remove <span className="font-medium text-slate-800">{empToRemove?.first_name} {empToRemove?.last_name}</span> from this store?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setEmpToRemove(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleRemove} className="btn bg-red-600 text-white hover:bg-red-700 flex-1 px-4 py-2 text-sm font-semibold rounded-lg">Remove</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EmployeeAttendanceRecords({ employeeId }) {
  if (!employeeId) return null;
  const records = attendanceRecords.filter(a => a.e_id === employeeId);
  if (records.length === 0) return <EmptyState icon={Clock} title="No attendance records" message="This employee has no attendance history yet." />;
  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {records.map(a => (
        <div key={a.attendance_id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
              <Calendar size={16} className="text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{a.date}</p>
              <p className="text-xs text-slate-400">{a.check_in_time || '—'} → {a.check_out_time || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {a.check_in_time && a.check_out_time ? (
              <span className="text-sm font-medium text-slate-700">{(() => {
                const [ih, im] = a.check_in_time.split(':').map(Number);
                const [oh, om] = a.check_out_time.split(':').map(Number);
                const mins = (oh * 60 + om) - (ih * 60 + im);
                return (mins / 60).toFixed(1);
              })()}h</span>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
            {a.check_out_time ? <Badge variant="success">Complete</Badge> : <Badge variant="warning">In Progress</Badge>}
          </div>
        </div>
      ))}
    </div>
  );
}

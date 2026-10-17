import { useState, useEffect } from "react";
import { PageHeader, EmptyState, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import {
  User,
  Calendar, Briefcase, DollarSign, Mail, Phone, Building2
} from 'lucide-react';
import { apiGetEmployeeById, apiGetStoreById, apiGetMallById } from '@/lib/api.js';

export default function ProfileView({ empId, user }) {
  const [employee, setEmployee] = useState(null);
  const [storeName, setStoreName] = useState(null);
  const [mallName, setMallName] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoaded(false);
    (async () => {
      try {
        const emp = await apiGetEmployeeById(empId);
        if (cancelled) return;
        setEmployee(emp);
        const [store, mall] = await Promise.all([
          emp?.store_id ? apiGetStoreById(emp.store_id) : Promise.resolve(null),
          emp?.mall_id ? apiGetMallById(emp.mall_id) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setStoreName(store?.store_name ?? null);
        setMallName(mall ? `${mall.city}, ${mall.state}` : null);
        setLoaded(true);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [empId]);

  if (error) return <ErrorState message={error} />;
  if (!loaded) return <LoadingSpinner label="Loading profile..." />;
  if (!employee) return <EmptyState title="Profile not found" />;

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your personal and employment information" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{user.firstName} {user.lastName}</h3>
              <p className="text-sm text-slate-500">{employee.current_designation}</p>
            </div>
          </div>
          <div className="space-y-2">
            <ProfileRow icon={Mail} label="Email" value={employee.email} />
            <ProfileRow icon={Phone} label="Phone" value={employee.phone_number} />
            <ProfileRow icon={Calendar} label="Date of Joining" value={employee.date_of_joining} />
            <ProfileRow icon={Briefcase} label="Designation" value={employee.current_designation} />
            <ProfileRow icon={DollarSign} label="Base Salary" value={`${employee.base_salary.toLocaleString()}`} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Employment Details</h3>
          <div className="space-y-2">
            <ProfileRow icon={User} label="Employee ID" value={employee.employee_id} />
            <ProfileRow icon={Building2} label="Store" value={employee.store_id ? (storeName ?? employee.store_id) : 'Direct Mall Hire'} />
            <ProfileRow icon={Building2} label="Mall" value={mallName ?? employee.mall_id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50">
      <Icon size={16} className="text-slate-400 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

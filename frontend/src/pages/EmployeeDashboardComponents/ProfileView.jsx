import React from "react";
import {PageHeader} from '@/components/ui/index.jsx'
import {
  Home, Clock, FileText, Briefcase, User,
  Calendar, CheckCircle2, XCircle, AlertCircle, DollarSign,
  LogIn, LogOut, Plus, TrendingUp, Mail, Phone, Building2
} from 'lucide-react';
import {
  getEmployeeById, getLeaveRequestsByEmployee, getPayrollByEmployee,
  getAttendanceByEmployee, employees, getStoreById, getMallById,
  attendanceRecords, leaveRequests
} from '@/lib/mockData.js';
import {
  apiGetEmployeeById, apiGetLeaveRequests, apiApplyLeave,
  apiGetPayroll, apiGetAttendance, apiCheckIn, apiCheckOut
} from '@/lib/api.js';

export default function ProfileView({ empId, user }) {
  const employee = getEmployeeById(empId);
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
            <ProfileRow icon={Building2} label="Store" value={employee.store_id ? getStoreName(employee.store_id) : 'Direct Mall Hire'} />
            <ProfileRow icon={Building2} label="Mall" value={getMallName(employee.mall_id)} />
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

function getStoreName(storeId) {
  const s = getStoreById(storeId);
  return s ? s.store_name : storeId;
}

function getMallName(mallId) {
  const m = getMallById(mallId);
  return m ? `${m.city}, ${m.state}` : mallId;
}
import { useState, useEffect } from 'react';
import { PageHeader, StatCard, DataTable, Badge, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import { Briefcase, DollarSign, TrendingUp, Download } from 'lucide-react';

import { apiGetEmployeeById, apiGetPayroll } from '@/lib/api.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => `$${Number(n ?? 0).toLocaleString()}`;

function buildSlipHtml(emp, rec) {
  const name = `${emp?.first_name ?? ''} ${emp?.last_name ?? ''}`.trim() || '—';
  const profile = [
    ['Employee ID', emp?.employee_id],
    ['Name', name],
    ['Designation', emp?.current_designation],
    ['Email', emp?.email],
    ['Phone', emp?.phone_number],
    ['Date of Joining', emp?.date_of_joining],
    ['Base Salary', money(emp?.base_salary)],
  ];
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Salary Slip ${esc(rec.record_id)}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,-apple-system,Arial,sans-serif;color:#1e293b;margin:40px auto;max-width:680px}
  .hd{border-bottom:2px solid #1e293b;padding-bottom:12px;margin-bottom:20px}
  h1{font-size:20px;margin:0;letter-spacing:.3px}
  .sub{color:#64748b;font-size:12px;margin:4px 0 0}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.6px;color:#64748b;margin:24px 0 8px}
  .row{display:flex;justify-content:space-between;border-bottom:1px dashed #e2e8f0;padding:6px 0;font-size:13px}
  .k{color:#64748b}.v{font-weight:600}
  table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #e2e8f0;padding:8px;font-size:13px;text-align:left}
  th{background:#f8fafc;font-size:12px}
  .net{text-align:right;font-size:17px;font-weight:700;margin-top:16px}
  .foot{margin-top:32px;font-size:11px;color:#94a3b8}
  @media print{body{margin:12mm auto}}
</style></head><body>
  <div class="hd"><h1>MallHub &mdash; Salary Slip</h1>
    <p class="sub">Slip #${esc(rec.record_id)} &middot; Issued ${esc(rec.issue_date)}</p></div>
  <h2>Employee Details</h2>
  ${profile.map(([k, v]) => `<div class="row"><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('')}
  <h2>Payment Details</h2>
  <table><thead><tr><th>Slip ID</th><th>Type</th><th>Amount</th><th>Issue Date</th></tr></thead>
    <tbody><tr><td>${esc(rec.record_id)}</td><td>${esc(rec.record_type)}</td><td>${money(rec.amount)}</td><td>${esc(rec.issue_date)}</td></tr></tbody></table>
  <p class="net">Net Pay: ${money(rec.amount)}</p>
  <p class="foot">Generated on ${new Date().toLocaleDateString()} &middot; This is a computer-generated slip and does not require a signature.</p>
</body></html>`;
}

export default function SalaryView({ empId }) {
  const [payroll, setPayroll] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([apiGetPayroll(empId), apiGetEmployeeById(empId)])
      .then(([pay, emp]) => {
        if (!cancelled) { setPayroll(pay); setEmployee(emp); }
      })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [empId]);

  const handleDownload = (rec) => {
    const win = window.open('', '_blank', 'width=820,height=900');
    if (!win) return;
    win.document.open();
    win.document.write(buildSlipHtml(employee, rec));
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 250);
  };

  if (error) return <ErrorState message={error} />;
  if (!payroll) return <LoadingSpinner label="Loading salary records..." />;

  const totalEarnings = payroll.filter(p => p.record_type !== 'deduction').reduce((s, p) => s + p.amount, 0);
  const totalDeductions = payroll.filter(p => p.record_type === 'deduction').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader title="Salary Slips" subtitle="Your payroll and earnings history" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Base Salary" value={`$${Number(employee?.base_salary ?? 0).toLocaleString()}`} color="brand" />
        <StatCard icon={TrendingUp} label="Total Earnings" value={`$${totalEarnings.toLocaleString()}`} color="success" />
        <StatCard icon={Briefcase} label="Pay Records" value={payroll.length} color="accent" />
      </div>
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'record_id', label: 'Slip ID', render: p => <span className="text-slate-400 font-mono text-xs">{p.record_id}</span> },
            { key: 'record_type', label: 'Type', render: p => <Badge variant={p.record_type === 'salary' ? 'brand' : p.record_type === 'bonus' ? 'success' : 'error'}>{p.record_type}</Badge> },
            { key: 'amount', label: 'Amount', render: p => <span className="font-semibold text-slate-900">${p.amount.toLocaleString()}</span> },
            { key: 'issue_date', label: 'Issue Date', render: p => <span className="text-slate-500">{p.issue_date}</span> },
            { key: 'download', label: '', render: p => (
              <button onClick={() => handleDownload(p)} className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium">
                <Download size={14} /> Download
              </button>
            ) },
          ]}
          rows={payroll}
          emptyMessage="No salary records yet."
        />
      </div>
    </div>
  );
}

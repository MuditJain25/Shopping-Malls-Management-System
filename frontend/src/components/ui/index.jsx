import { AlertCircle } from 'lucide-react';

export function EmptyState({ icon: Icon = AlertCircle, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon size={32} className="text-slate-300 mb-3" />
      <h3 className="text-base font-semibold text-slate-600 mb-1">{title}</h3>
      {message && <p className="text-sm text-slate-400 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
      <AlertCircle size={20} className="text-red-500 shrink-0" />
      <p className="text-sm text-red-700">{message || 'Something went wrong. Please try again.'}</p>
    </div>
  );
}

export function LoadingSpinner({ label }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
        {label && <p className="text-sm text-slate-500">{label}</p>}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="skeleton h-32 w-full mb-4" />
      <div className="skeleton h-4 w-3/4 mb-2" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color = 'brand' }) {
  const colorMap = {
    brand: 'bg-brand-100 text-brand-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-orange-100 text-orange-600',
    error: 'bg-red-100 text-red-600',
    accent: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function Badge({ variant = 'neutral', children }) {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    brand: 'badge-brand',
    neutral: 'badge-neutral',
  };
  return <span className={variants[variant]}>{children}</span>;
}

export function DataTable({ columns, rows, emptyMessage }) {
  if (!rows || rows.length === 0) {
    return <EmptyState title="No data" message={emptyMessage || 'There are no records to display.'} />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map(col => (
              <th key={col.key} className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-2">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-2.5 text-sm text-slate-700">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

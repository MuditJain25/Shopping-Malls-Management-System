import { DollarSign } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui/index.jsx";
import { payrollRecords } from "@/lib/mockData";

export default function PayrollRecords({ employeeId }) {
  const records = payrollRecords.filter((p) => p.e_id === employeeId);

  if (records.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="No payroll records"
        message="This employee has no payroll history yet."
      />
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {records.map((record) => (
        <div
          key={record.record_id}
          className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
              <DollarSign size={16} className="text-brand-600" />
            </div>

            <div>
              <Badge
                variant={record.record_type === "bonus" ? "success" : "brand"}
              >
                {record.record_type}
              </Badge>

              <p className="text-xs text-slate-400">{record.issue_date}</p>
            </div>
          </div>

          <span className="text-sm font-medium text-slate-700">
            ${record.amount.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

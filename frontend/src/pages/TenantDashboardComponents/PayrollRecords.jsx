import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui/index.jsx";
import { apiGetPayroll } from "@/lib/api";

export default function PayrollRecords({ employeeId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (employeeId == null) {
      setRecords([]);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;

    setLoading(true);
    setRecords([]);
    setError("");

    apiGetPayroll(employeeId)
      .then((data) => {
        if (!cancelled) {
          setRecords(
            Array.isArray(data) ? data : (data?.content ?? data?.items ?? []),
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load payroll records:", error);
          setError(error.message || "Failed to load payroll records.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  if (loading) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        Loading payroll records...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }

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
    <div className="h-full space-y-2 overflow-y-auto">
      {records.map((record, index) => {
        const recordType = record.record_type ?? record.recordType ?? "Payroll";
        const issueDate = record.issue_date ?? record.issueDate;
        const amount = Number(record.amount ?? 0);

        return (
          <div
            key={record.record_id ?? record.recordId ?? index}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                <DollarSign size={16} className="text-brand-600" />
              </div>

              <div>
                <Badge
                  variant={
                    String(recordType).toLowerCase() === "bonus"
                      ? "success"
                      : "brand"
                  }
                >
                  {recordType}
                </Badge>

                <p className="text-xs text-slate-400">{issueDate || "—"}</p>
              </div>
            </div>

            <span className="text-sm font-medium text-slate-700">
              ${amount.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

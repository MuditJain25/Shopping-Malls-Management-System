import { useEffect, useState } from "react";
import { FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { PageHeader, Badge, EmptyState } from "@/components/ui/index.jsx";
import {
  apiGetStoreLeaveRequests,
  apiGetEmployeesByStore,
  apiDecideLeave,
} from "@/lib/api";

export default function LeaveView({ stores }) {
  const [selectedStore, setSelectedStore] = useState(stores[0]?.store_id ?? "");

  const [leaveReqs, setLeaveReqs] = useState([]);
  const [storeEmployees, setStoreEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingRequestId, setUpdatingRequestId] = useState(null);

  const store =
    stores.find((s) => String(s.store_id) === String(selectedStore)) ||
    stores[0];

  const storeId = store?.store_id;

  useEffect(() => {
    if (storeId == null) {
      setLeaveReqs([]);
      setStoreEmployees([]);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;

    async function loadLeaveData() {
      setLoading(true);
      setError("");
      setActionError("");
      setLeaveReqs([]);
      setStoreEmployees([]);

      try {
        const [requestsData, employeesData] = await Promise.all([
          apiGetStoreLeaveRequests(storeId),
          apiGetEmployeesByStore(storeId),
        ]);

        if (cancelled) return;

        const requests = Array.isArray(requestsData)
          ? requestsData
          : (requestsData?.content ?? requestsData?.items ?? []);

        const employees = Array.isArray(employeesData)
          ? employeesData
          : (employeesData?.content ?? employeesData?.items ?? []);

        setLeaveReqs(
          requests.map((request) => ({
            ...request,
            request_id: request.request_id ?? request.requestId,
            e_id: request.e_id ?? request.employee_id ?? request.employeeId,
            start_date: request.start_date ?? request.startDate,
            end_date: request.end_date ?? request.endDate,
          })),
        );

        setStoreEmployees(employees);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load leave requests:", err);
          setError(err.message || "Failed to load leave requests.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLeaveData();

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const getEmployee = (employeeId) =>
    storeEmployees.find(
      (employee) =>
        String(employee.employee_id ?? employee.e_id ?? employee.id) ===
        String(employeeId),
    );

  const handleDecision = async (request, status) => {
    const requestId = request.request_id;
    const employeeId = request.e_id;

    if (requestId == null || employeeId == null || updatingRequestId != null) {
      return;
    }

    setUpdatingRequestId(requestId);
    setActionError("");

    try {
      await apiDecideLeave(employeeId, requestId, status);

      setLeaveReqs((currentRequests) =>
        currentRequests.map((item) =>
          String(item.request_id) === String(requestId)
            ? { ...item, status }
            : item,
        ),
      );
    } catch (err) {
      console.error("Failed to update leave request:", err);
      setActionError(
        err.message ||
          `Failed to ${status === "approved" ? "approve" : "reject"} leave request.`,
      );
    } finally {
      setUpdatingRequestId(null);
    }
  };

  if (!store) {
    return (
      <EmptyState title="No stores" message="You don't have any stores yet." />
    );
  }

  return (
    <div>
      <PageHeader
        title="Leave Requests"
        subtitle="Review and approve leave requests from your employees"
      />

      {stores.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {stores.map((s) => (
            <button
              key={s.store_id}
              onClick={() => setSelectedStore(s.store_id)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                String(selectedStore) === String(s.store_id)
                  ? "bg-brand-600 text-white"
                  : "bg-white border border-slate-300 text-slate-600"
              }`}
            >
              {s.store_name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-4" role="alert">
          Could not load leave requests: {error}
        </p>
      )}

      {actionError && (
        <p className="text-sm text-red-600 mb-4" role="alert">
          {actionError}
        </p>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Loading leave requests...
        </p>
      ) : error ? null : leaveReqs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No leave requests"
          message="No leave requests from employees in this store."
        />
      ) : (
        <div className="space-y-3">
          {leaveReqs.map((lr) => {
            const emp = getEmployee(lr.e_id);
            const status = String(lr.status ?? "").toLowerCase();
            const isUpdating =
              String(updatingRequestId) === String(lr.request_id);

            return (
              <div key={lr.request_id} className="card p-4">
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">
                      {emp ? `${emp.first_name} ${emp.last_name}` : lr.e_id}
                    </p>
                    <p className="text-xs text-slate-400">
                      {emp?.current_designation || ""}
                    </p>
                  </div>

                  {status === "approved" && (
                    <Badge variant="success">
                      <CheckCircle2 size={12} />
                      Approved
                    </Badge>
                  )}

                  {status === "rejected" && (
                    <Badge variant="error">
                      <XCircle size={12} />
                      Rejected
                    </Badge>
                  )}

                  {status === "pending" && (
                    <Badge variant="warning">
                      <AlertCircle size={12} />
                      Pending
                    </Badge>
                  )}
                </div>

                <div className="text-sm text-slate-600 mb-2">
                  <span className="text-slate-500">Dates: </span>
                  {lr.start_date} → {lr.end_date}
                </div>

                <p className="text-sm text-slate-500 mb-3">{lr.reason}</p>

                {status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      disabled={updatingRequestId != null}
                      onClick={() => handleDecision(lr, "approved")}
                      className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 text-sm font-semibold rounded-lg"
                    >
                      <CheckCircle2 size={14} />
                      {isUpdating ? "Updating..." : "Approve"}
                    </button>

                    <button
                      disabled={updatingRequestId != null}
                      onClick={() => handleDecision(lr, "rejected")}
                      className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 text-sm font-semibold rounded-lg"
                    >
                      <XCircle size={14} />
                      {isUpdating ? "Updating..." : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

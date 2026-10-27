import { useEffect, useState } from "react";
import { Plus, Trash2, Clock, Calendar, DollarSign } from "lucide-react";
import {
  PageHeader,
  DataTable,
  Badge,
  EmptyState,
} from "@/components/ui/index.jsx";
import Modal from "@/components/ui/Modal.jsx";
import PayrollRecords from "./PayrollRecords";
import {
  apiAddStoreEmployee,
  apiDeleteEmployee,
  apiGetEmployeesByStore,
  apiGetAttendance,
} from "@/lib/api";

export default function EmployeesView({ stores, profileId }) {
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState("");
  const [selectedStore, setSelectedStore] = useState(stores[0]?.store_id || "");
  const [storeEmployees, setStoreEmployees] = useState([]);
  const [newEmp, setNewEmp] = useState({
    first_name: "",
    last_name: "",
    email: "",
    base_salary: "",
    current_designation: "",
    phone_number: "",
  });
  const [empToRemove, setEmpToRemove] = useState(null);
  const [removeError, setRemoveError] = useState("");
  const [empForDetails, setEmpForDetails] = useState(null);
  const [employeeTab, setEmployeeTab] = useState(null);

  const store = stores.find((s) => s.store_id === selectedStore) || stores[0];
  const storeId = store?.store_id;

  useEffect(() => {
    if (storeId == null) {
      setStoreEmployees([]);
      return;
    }

    let cancelled = false;

    setStoreEmployees([]);

    apiGetEmployeesByStore(storeId)
      .then((data) => {
        if (!cancelled) {
          const employeeList = Array.isArray(data)
            ? data
            : (data?.content ?? data?.items ?? []);

          setStoreEmployees(employeeList);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load store employees:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const handleAdd = async () => {
    if (!store) return;

    setAddError("");

    if (profileId == null) {
      setAddError("Unable to identify your profile. Please sign in again.");
      return;
    }

    try {
      const createdEmployee = await apiAddStoreEmployee(profileId, {
        ...newEmp,
        base_salary: parseFloat(newEmp.base_salary) || 0,
        store_id: store.store_id,
      });

      setStoreEmployees((currentEmployees) => [
        ...currentEmployees,
        createdEmployee,
      ]);

      setShowAdd(false);
      setNewEmp({
        first_name: "",
        last_name: "",
        email: "",
        base_salary: "",
        current_designation: "",
        phone_number: "",
      });
    } catch (error) {
      setAddError(error.message || "Failed to add employee. Please try again.");
    }
  };

  const handleRemove = async () => {
    if (!empToRemove) return;

    setRemoveError("");

    try {
      await apiDeleteEmployee(empToRemove.employee_id);

      setStoreEmployees((currentEmployees) =>
        currentEmployees.filter(
          (employee) =>
            String(employee.employee_id) !== String(empToRemove.employee_id),
        ),
      );

      setEmpToRemove(null);
    } catch (error) {
      setRemoveError(
        error.message || "Failed to remove employee. Please try again.",
      );
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
        title="Employees"
        subtitle="Track employees under your stores"
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary text-sm"
          >
            <Plus size={16} /> Add Employee
          </button>
        }
      />

      {stores.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {stores.map((s) => (
            <button
              key={s.store_id}
              onClick={() => setSelectedStore(s.store_id)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                selectedStore === s.store_id
                  ? "bg-brand-600 text-white"
                  : "bg-white border border-slate-300 text-slate-600"
              }`}
            >
              {s.store_name}
            </button>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <DataTable
          columns={[
            {
              key: "name",
              label: "Name",
              render: (e) => (
                <button
                  onClick={() => {
                    setEmpForDetails(e);
                    setEmployeeTab("attendance");
                  }}
                  className="font-medium text-brand-700 hover:text-brand-800 hover:underline"
                >
                  {e.first_name} {e.last_name}
                </button>
              ),
            },
            {
              key: "designation",
              label: "Designation",
              render: (e) => (
                <Badge variant="brand">{e.current_designation}</Badge>
              ),
            },
            {
              key: "email",
              label: "Email",
              render: (e) => <span className="text-slate-600">{e.email}</span>,
            },
            {
              key: "phone",
              label: "Phone",
              render: (e) => (
                <span className="text-slate-600">{e.phone_number}</span>
              ),
            },
            {
              key: "salary",
              label: "Base Salary",
              render: (e) => (
                <span className="font-medium text-slate-800">
                  ${Number(e.base_salary ?? 0).toLocaleString()}
                </span>
              ),
            },
            {
              key: "joined",
              label: "Joined",
              render: (e) => (
                <span className="text-slate-500">{e.date_of_joining}</span>
              ),
            },
            {
              key: "actions",
              label: "",
              render: (e) => (
                <button
                  onClick={() => {
                    setEmpToRemove(e);
                    setRemoveError("");
                  }}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                  title="Remove employee"
                >
                  <Trash2 size={14} />
                </button>
              ),
            },
          ]}
          rows={storeEmployees}
          emptyMessage="No employees hired for this store yet."
        />
      </div>

      <Modal
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          setAddError("");
        }}
        title="Add Employee"
        size="md"
      >
        <div className="space-y-4">
          {addError && (
            <p className="text-sm text-red-600" role="alert">
              {addError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input
                className="input"
                value={newEmp.first_name}
                onChange={(e) =>
                  setNewEmp({ ...newEmp, first_name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="label">Last Name</label>
              <input
                className="input"
                value={newEmp.last_name}
                onChange={(e) =>
                  setNewEmp({ ...newEmp, last_name: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={newEmp.email}
              onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              className="input"
              value={newEmp.phone_number}
              onChange={(e) =>
                setNewEmp({ ...newEmp, phone_number: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Designation</label>
            <input
              className="input"
              value={newEmp.current_designation}
              onChange={(e) =>
                setNewEmp({ ...newEmp, current_designation: e.target.value })
              }
              placeholder="e.g. Sales Associate"
            />
          </div>

          <div>
            <label className="label">Base Salary ($)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={newEmp.base_salary}
              onChange={(e) =>
                setNewEmp({ ...newEmp, base_salary: e.target.value })
              }
            />
          </div>

          <button onClick={handleAdd} className="btn-primary w-full">
            Add Employee
          </button>
        </div>
      </Modal>

      <Modal
        open={!!empForDetails}
        onClose={() => setEmpForDetails(null)}
        title={
          empForDetails
            ? `${empForDetails.first_name} ${empForDetails.last_name}`
            : "Employee Details"
        }
        size="md"
      >
        <div className="space-y-4">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setEmployeeTab("attendance")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                employeeTab === "attendance"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Clock size={15} />
              Attendance
            </button>

            <button
              onClick={() => setEmployeeTab("payroll")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                employeeTab === "payroll"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <DollarSign size={15} />
              Payroll
            </button>
          </div>

          <div className="h-64 min-h-64">
            {employeeTab === "attendance" ? (
              <EmployeeAttendanceRecords
                employeeId={empForDetails?.employee_id}
              />
            ) : (
              <PayrollRecords employeeId={empForDetails?.employee_id} />
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={!!empToRemove}
        onClose={() => {
          setEmpToRemove(null);
          setRemoveError("");
        }}
        title="Remove Employee"
        size="sm"
      >
        <div className="space-y-4">
          {removeError && (
            <p className="text-sm text-red-600" role="alert">
              {removeError}
            </p>
          )}

          <p className="text-sm text-slate-600">
            Are you sure you want to remove{" "}
            <span className="font-medium text-slate-800">
              {empToRemove?.first_name} {empToRemove?.last_name}
            </span>{" "}
            from this store?
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setEmpToRemove(null);
                setRemoveError("");
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>

            <button
              onClick={handleRemove}
              className="btn bg-red-600 text-white hover:bg-red-700 flex-1 px-4 py-2 text-sm font-semibold rounded-lg"
            >
              Remove
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EmployeeAttendanceRecords({ employeeId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (employeeId == null) {
      setRecords([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError("");
    setRecords([]);

    apiGetAttendance(employeeId)
      .then((data) => {
        if (!cancelled) {
          setRecords(
            Array.isArray(data) ? data : (data?.content ?? data?.items ?? []),
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load employee attendance:", error);
          setError(error.message || "Failed to load attendance records.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  if (loading) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        Loading attendance records...
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
        icon={Clock}
        title="No attendance records"
        message="This employee has no attendance history yet."
      />
    );
  }

  return (
    <div className="h-full space-y-2 overflow-y-auto">
      {records.map((record) => (
        <div
          key={
            record.attendance_id ??
            `${record.employee_id ?? record.e_id}-${record.date}`
          }
          className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
              <Calendar size={16} className="text-brand-600" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-800">
                {record.date}
              </p>
              <p className="text-xs text-slate-400">
                {record.check_in_time || "—"} → {record.check_out_time || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {record.check_in_time && record.check_out_time ? (
              <span className="text-sm font-medium text-slate-700">
                {(() => {
                  const [ih, im] = record.check_in_time.split(":").map(Number);
                  const [oh, om] = record.check_out_time.split(":").map(Number);
                  const mins = oh * 60 + om - (ih * 60 + im);
                  return (mins / 60).toFixed(1);
                })()}
                h
              </span>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}

            {record.check_out_time ? (
              <Badge variant="success">Complete</Badge>
            ) : (
              <Badge variant="warning">In Progress</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, DataTable } from "@/components/ui/index.jsx";
import Modal from "@/components/ui/Modal.jsx";
import {
  apiGetTransactionsByTenant,
  apiCreateTransaction,
  apiGetMallsByTenant,
  apiDeleteTransaction,
} from "@/lib/api.js";

const REMARK_PREVIEW_LENGTH = 55;
const DATE_REMARK_PREFIX = "Date: ";

function getTodayLocalDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function getDisplayRemarks(remarks) {
  const lines = String(remarks || "").split(/\r?\n/);

  if (/^Date:\s*\d{4}-\d{2}-\d{2}$/.test(lines[0]?.trim())) {
    lines.shift();
  }

  return lines.join("\n").trim();
}

const createInitialForm = () => ({
  mallId: "",
  amount: "",
  transactionDate: getTodayLocalDate(),
  remarks: "",
});

export default function TransactionsView({ tenantId, tenantName }) {
  const [transactions, setTransactions] = useState([]);
  const [malls, setMalls] = useState([]);

  const [loading, setLoading] = useState(true);
  const [mallsLoading, setMallsLoading] = useState(true);

  const [error, setError] = useState("");
  const [mallsError, setMallsError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(createInitialForm);
  const [formError, setFormError] = useState("");

  const [selectedRemark, setSelectedRemark] = useState(null);

  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchTransactions = useCallback(async () => {
    if (tenantId == null) {
      setError("Tenant information is unavailable.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await apiGetTransactionsByTenant(tenantId);

      setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setError(err.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const fetchMalls = useCallback(async () => {
    if (tenantId == null) {
      setMallsError("Tenant information is unavailable.");
      setMallsLoading(false);
      return;
    }

    try {
      setMallsLoading(true);
      setMallsError("");

      const data = await apiGetMallsByTenant(tenantId);

      setMalls(data);
    } catch (err) {
      console.error("Failed to fetch tenant malls:", err);
      setMallsError(err.message || "Failed to load malls.");
    } finally {
      setMallsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTransactions();
    fetchMalls();
  }, [fetchTransactions, fetchMalls]);

  // Update form fields.
  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Find the selected mall.
  const selectedMall = useMemo(
    () => malls.find((mall) => String(mall.mall_id) === String(form.mallId)),
    [malls, form.mallId],
  );

  // Submit a new transaction.
  const handleSubmit = async () => {
    const amount = Number(form.amount);

    if (!tenantName?.trim()) {
      setFormError("Tenant business name is unavailable.");
      return;
    }

    if (!selectedMall) {
      setFormError("Please select a mall.");
      return;
    }

    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      setFormError("Please enter a valid transaction amount.");
      return;
    }

    if (!form.transactionDate) {
      setFormError("Please select the transaction date.");
      return;
    }

    if (!form.remarks.trim()) {
      setFormError("Please enter transaction remarks.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      // Always store the transaction date as the first
      // line of the remarks field.
      const remarks = [
        `${DATE_REMARK_PREFIX}${form.transactionDate}`,
        form.remarks.trim(),
      ].join("\n");

      await apiCreateTransaction({
        amount,
        sender: tenantName.trim(),
        receiver: selectedMall.mall_name,
        senderType: "tenant",
        receiverType: "mall",
        transactionDate: form.transactionDate,
        remarks,
      });

      setForm(createInitialForm());
      setShowAdd(false);

      await fetchTransactions();
    } catch (err) {
      console.error("Failed to create transaction:", err);
      setFormError(err.message || "Failed to create transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open delete confirmation.
  const confirmDelete = (transaction) => {
    setDeleteError("");
    setTransactionToDelete(transaction);
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;

    try {
      setDeleting(true);
      setDeleteError("");

      await apiDeleteTransaction(transactionToDelete.transaction_id);

      setTransactionToDelete(null);

      await fetchTransactions();
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      setDeleteError(err.message || "Failed to delete transaction.");
    } finally {
      setDeleting(false);
    }
  };

  const displayTransactions = useMemo(() => {
    return [...transactions].map((transaction, index) => ({
      ...transaction,
      serial_no: index + 1,
    }));
  }, [transactions]);

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Store transaction history with the mall"
        action={
          <button
            onClick={() => {
              setForm(createInitialForm());
              setFormError("");
              setShowAdd(true);
            }}
            className="btn-primary text-sm"
          >
            <Plus size={16} /> Add Transaction
          </button>
        }
      />

      {/* Transaction loading error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          {error}
          <button onClick={fetchTransactions} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-500">
            Loading transactions...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">
            Unable to load transactions.
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "serial_no",
                label: "S.No.",
                render: (t) => (
                  <span className="text-slate-400 font-mono text-xs">
                    {t.serial_no}
                  </span>
                ),
              },
              {
                key: "sender",
                label: "From",
                render: (t) => (
                  <span className="font-medium text-slate-800">{t.sender}</span>
                ),
              },
              {
                key: "receiver",
                label: "To",
                render: (t) => (
                  <span className="text-slate-600">{t.receiver}</span>
                ),
              },
              {
                key: "amount",
                label: "Amount",
                render: (t) => (
                  <span className="font-semibold text-green-600">
                    ${Number(t.amount).toLocaleString()}
                  </span>
                ),
              },
              {
                key: "transaction_date",
                label: "Date",
                render: (t) => (
                  <span className="text-slate-500">{t.transaction_date}</span>
                ),
              },
              {
                key: "remarks",
                label: "Remarks",
                render: (t) => {
                  // Hide the date metadata in the frontend.
                  const remark = getDisplayRemarks(t.remarks);

                  if (!remark) {
                    return <span className="text-slate-400 text-xs">-</span>;
                  }

                  if (remark.length > REMARK_PREVIEW_LENGTH) {
                    return (
                      <button
                        type="button"
                        onClick={() => setSelectedRemark(remark)}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-xs text-left max-w-[220px] truncate block"
                        title="Click to read full remark"
                      >
                        {remark}
                      </button>
                    );
                  }

                  return (
                    <span className="text-slate-500 text-xs">{remark}</span>
                  );
                },
              },
              {
                key: "actions",
                label: "Action",
                render: (t) => (
                  <button
                    type="button"
                    onClick={() => confirmDelete(t)}
                    className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="Delete transaction"
                    aria-label="Delete transaction"
                  >
                    <Trash2 size={14} />
                  </button>
                ),
              },
            ]}
            rows={displayTransactions}
            emptyMessage="No transactions recorded yet."
          />
        )}
      </div>

      {/* Add Transaction Modal */}
      <Modal
        open={showAdd}
        onClose={() => {
          if (!submitting) setShowAdd(false);
        }}
        title="Add Transaction"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Automatically populated tenant name */}
            <div>
              <label className="label">From</label>
              <input
                className="input bg-slate-50"
                value={tenantName || ""}
                readOnly
                placeholder="Loading tenant business name..."
              />
            </div>

            {/* Mall selection */}
            <div>
              <label className="label">To (Mall)</label>
              <select
                className="input"
                value={form.mallId}
                onChange={(e) => updateForm("mallId", e.target.value)}
                disabled={submitting || mallsLoading || !!mallsError}
              >
                <option value="">
                  {mallsLoading ? "Loading malls..." : "Select Mall"}
                </option>

                {malls.map((mall) => (
                  <option key={mall.mall_id} value={mall.mall_id}>
                    {mall.mall_name}
                  </option>
                ))}
              </select>

              {mallsError && (
                <p className="text-xs text-red-600 mt-1">{mallsError}</p>
              )}

              {!mallsLoading && !mallsError && malls.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  No malls are associated with this tenant.
                </p>
              )}
            </div>

            <div>
              <label className="label">Amount ($)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="input"
                value={form.amount}
                onChange={(e) => updateForm("amount", e.target.value)}
                placeholder="Enter amount"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="label">Transaction Date</label>
              <input
                type="date"
                className="input"
                value={form.transactionDate}
                onChange={(e) => updateForm("transactionDate", e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label className="label">Remarks</label>
            <textarea
              required
              className="input min-h-24"
              value={form.remarks}
              onChange={(e) => updateForm("remarks", e.target.value)}
              placeholder="Enter transaction remarks"
              disabled={submitting}
            />
            <p className="text-xs text-slate-400 mt-1">
              The transaction date will automatically be stored as the first
              line of the remarks.
            </p>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            onClick={handleSubmit}
            disabled={
              submitting ||
              mallsLoading ||
              !!mallsError ||
              !tenantName?.trim() ||
              !selectedMall
            }
            className="btn-primary w-full disabled:opacity-50"
          >
            {submitting ? "Adding Transaction..." : "Add Transaction"}
          </button>
        </div>
      </Modal>

      {/* Full Remarks Modal */}
      <Modal
        open={selectedRemark !== null}
        onClose={() => setSelectedRemark(null)}
        title="Transaction Remarks"
        size="md"
      >
        <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
          {selectedRemark}
        </p>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={transactionToDelete !== null}
        onClose={() => {
          if (!deleting) {
            setTransactionToDelete(null);
            setDeleteError("");
          }
        }}
        title="Delete Transaction"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this transaction?
          </p>

          {transactionToDelete && (
            <div className="bg-slate-50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-slate-800">
                {transactionToDelete.sender} → {transactionToDelete.receiver}
              </p>
              <p className="text-sm text-slate-500">
                Amount: ${Number(transactionToDelete.amount).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">
                Date: {transactionToDelete.transaction_date}
              </p>
            </div>
          )}

          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setTransactionToDelete(null);
                setDeleteError("");
              }}
              disabled={deleting}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

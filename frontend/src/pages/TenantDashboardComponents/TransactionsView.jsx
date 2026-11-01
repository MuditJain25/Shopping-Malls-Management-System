import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { PageHeader, DataTable } from "@/components/ui/index.jsx";
import Modal from "@/components/ui/Modal.jsx";
import {
  apiGetTransactionsByTenant,
  apiCreateTransaction,
  // apiGetMallsByTenant,
} from "@/lib/api.js";

const REMARK_PREVIEW_LENGTH = 55;

const createInitialForm = () => ({
  mallId: "",
  amount: "",
  transactionDate: new Date().toISOString().slice(0, 10),
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

  // Fetch transactions belonging to this tenant.
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

      // API already unwraps and normalizes the response.
      setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setError(err.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Fetch malls associated with this tenant.
  // const fetchMalls = useCallback(async () => {
  //   if (tenantId == null) {
  //     setMallsError("Tenant information is unavailable.");
  //     setMallsLoading(false);
  //     return;
  //   }

  //   try {
  //     setMallsLoading(true);
  //     setMallsError("");

  //     const data = await apiGetMallsByTenant(tenantId);

  //     // API already unwraps and normalizes the response.
  //     setMalls(data);
  //   } catch (err) {
  //     console.error("Failed to fetch tenant malls:", err);
  //     setMallsError(err.message || "Failed to load malls.");
  //   } finally {
  //     setMallsLoading(false);
  //   }
  // }, [tenantId]);

  // useEffect(() => {
  //   fetchTransactions();
  //   fetchMalls();
  // }, [fetchTransactions, fetchMalls]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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

  // Submit a transaction.
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

    if (!Number.isFinite(amount) || amount <= 0 || !form.amount) {
      setFormError("Please enter a valid transaction amount.");
      return;
    }

    if (!form.transactionDate) {
      setFormError("Please select a transaction date.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      await apiCreateTransaction({
        amount,
        sender: tenantName.trim(),
        receiver: selectedMall.mall_name,
        senderType: "tenant",
        receiverType: "mall",
        transactionDate: form.transactionDate,
        remarks: form.remarks.trim(),
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

  // Sort newest first and assign serial numbers.
  const displayTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const dateA = Date.parse(a.transaction_date);
        const dateB = Date.parse(b.transaction_date);

        const timestampA = Number.isFinite(dateA)
          ? dateA
          : Number.NEGATIVE_INFINITY;

        const timestampB = Number.isFinite(dateB)
          ? dateB
          : Number.NEGATIVE_INFINITY;

        return timestampB - timestampA;
      })
      .map((transaction, index) => ({
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
                  const remark = t.remarks || "";

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
                    <span className="text-slate-500 text-xs">
                      {remark || "-"}
                    </span>
                  );
                },
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
              className="input min-h-24"
              value={form.remarks}
              onChange={(e) => updateForm("remarks", e.target.value)}
              placeholder="Enter transaction remarks"
              disabled={submitting}
            />
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
    </div>
  );
}

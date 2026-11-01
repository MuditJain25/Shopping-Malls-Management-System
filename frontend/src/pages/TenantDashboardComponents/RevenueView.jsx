import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { PageHeader, DataTable } from "@/components/ui/index.jsx";
import Modal from "@/components/ui/Modal.jsx";
import { apiGetRevenueByTenant, apiSubmitRevenue } from "@/lib/api.js";

export default function RevenueView({ tenantId }) {
  const [showSubmit, setShowSubmit] = useState(false);
  const [description, setDescription] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiGetRevenueByTenant(tenantId);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch revenue reports:", err);
      setError(err.message || "Failed to load revenue reports.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await apiSubmitRevenue(tenantId, {
        description: description.trim(),
      });

      setDescription("");
      setShowSubmit(false);

      await fetchReports();
    } catch (err) {
      console.error("Failed to submit revenue report:", err);
      setError(err.message || "Failed to submit revenue report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Revenue Reports"
        subtitle="Share revenue information with the mall"
        action={
          <button
            onClick={() => {
              setError("");
              setShowSubmit(true);
            }}
            className="btn-primary text-sm"
          >
            <Plus size={16} /> Submit Report
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Reports Submitted</p>
          <p className="text-xl font-bold text-slate-900">
            {loading ? "..." : reports.length}
          </p>
        </div>
      </div>

      {error && !showSubmit && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-500">
            Loading revenue reports...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">
            {error}
            <button
              onClick={fetchReports}
              className="block mx-auto mt-3 text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "description",
                label: "Description",
                render: (r) => (
                  <span className="text-slate-700">{r.description}</span>
                ),
              },
              {
                key: "submitted_date",
                label: "Submitted",
                render: (r) => (
                  <span className="text-slate-500">
                    {r.submitted_date || "-"}
                  </span>
                ),
              },
            ]}
            rows={reports}
            emptyMessage="No revenue reports submitted yet."
          />
        )}
      </div>

      <Modal
        open={showSubmit}
        onClose={() => {
          if (!submitting) setShowSubmit(false);
        }}
        title="Submit Revenue Report"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-24"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. September 2026 revenue report"
              disabled={submitting}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
            className="btn-primary w-full disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

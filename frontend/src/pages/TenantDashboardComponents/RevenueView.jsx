import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, DataTable } from "@/components/ui/index.jsx";
import Modal from "@/components/ui/Modal.jsx";
import {
  apiGetRevenueByTenant,
  apiSubmitRevenue,
  apiDeleteRevenue,
} from "@/lib/api.js";

const REPORT_DATE_PREFIX = "Report Date: ";
const TENANT_NAME_PREFIX = "Tenant Name: ";

const createReportInfo = (report, fallbackTenantName) => {
  const lines = String(report.description || "").split(/\r?\n/);

  const hasMetadata =
    lines[1]?.startsWith(REPORT_DATE_PREFIX) &&
    lines[2]?.startsWith(TENANT_NAME_PREFIX);

  if (hasMetadata) {
    return {
      heading: lines[0].trim(),
      reportDate: lines[1].slice(REPORT_DATE_PREFIX.length).trim(),
      tenantName:
        lines[2].slice(TENANT_NAME_PREFIX.length).trim() ||
        fallbackTenantName ||
        "-",
      details: lines.slice(4).join("\n").trim(),
    };
  }

  // Backward compatibility with older reports.
  return {
    heading: lines[0]?.trim() || "Untitled Report",
    reportDate: "",
    tenantName: report.tenant_name || fallbackTenantName || "-",
    details: lines.slice(1).join("\n").trim(),
  };
};

export default function RevenueView({ tenantId, tenantName }) {
  const [showSubmit, setShowSubmit] = useState(false);

  const [heading, setHeading] = useState("");
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [reportDetails, setReportDetails] = useState("");

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [selectedReport, setSelectedReport] = useState(null);

  // Delete report state.
  const [reportToDelete, setReportToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Fetch revenue reports.
  const fetchReports = useCallback(async () => {
    if (tenantId == null) {
      setError("Tenant information is unavailable.");
      setLoading(false);
      return;
    }

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

  // Submit a new revenue report.
  const handleSubmit = async () => {
    if (!tenantName?.trim()) {
      setFormError("Tenant business name is unavailable.");
      return;
    }

    if (!reportDate) {
      setFormError("Please select the report date.");
      return;
    }

    if (!heading.trim()) {
      setFormError("Please enter a report heading.");
      return;
    }

    if (!reportDetails.trim()) {
      setFormError("Please enter the report details.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const description = [
        heading.trim(),
        `${REPORT_DATE_PREFIX}${reportDate}`,
        `${TENANT_NAME_PREFIX}${tenantName.trim()}`,
        "",
        reportDetails.trim(),
      ].join("\n");

      await apiSubmitRevenue(tenantId, { description });

      setHeading("");
      setReportDate(new Date().toISOString().slice(0, 10));
      setReportDetails("");
      setShowSubmit(false);

      await fetchReports();
    } catch (err) {
      console.error("Failed to submit revenue report:", err);
      setFormError(err.message || "Failed to submit revenue report.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a revenue report.
  const handleDelete = async () => {
    if (!reportToDelete) return;

    if (reportToDelete.information_id == null) {
      setDeleteError("Revenue report ID is unavailable.");
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      await apiDeleteRevenue(tenantId, reportToDelete.information_id);

      // Remove the deleted report from the UI.
      setReports((previous) =>
        previous.filter(
          (report) =>
            String(report.information_id) !==
            String(reportToDelete.information_id),
        ),
      );

      // Close the report details modal if it was open.
      if (
        selectedReport &&
        String(selectedReport.information_id) ===
          String(reportToDelete.information_id)
      ) {
        setSelectedReport(null);
      }

      setReportToDelete(null);
    } catch (err) {
      console.error("Failed to delete revenue report:", err);
      setDeleteError(err.message || "Failed to delete revenue report.");
    } finally {
      setDeleting(false);
    }
  };

  // Reset the submission form.
  const openSubmitModal = () => {
    setHeading("");
    setReportDate(new Date().toISOString().slice(0, 10));
    setReportDetails("");
    setFormError("");
    setShowSubmit(true);
  };

  return (
    <div>
      <PageHeader
        title="Revenue Reports"
        subtitle="Share revenue information with the mall"
        action={
          <button onClick={openSubmitModal} className="btn-primary text-sm">
            <Plus size={16} /> Submit Report
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Reports Submitted</p>
          <p className="text-xl font-bold text-slate-900">
            {loading ? "..." : reports.length}
          </p>
        </div>
      </div>

      {/* Fetch error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Reports table */}
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
                key: "tenant_name",
                label: "Tenant",
                render: (r) => {
                  const info = createReportInfo(r, tenantName);

                  return (
                    <span className="font-medium text-slate-800">
                      {info.tenantName}
                    </span>
                  );
                },
              },
              {
                key: "report_date",
                label: "Report Date",
                render: (r) => {
                  const info = createReportInfo(r, tenantName);

                  return (
                    <span className="text-slate-500">
                      {info.reportDate || "-"}
                    </span>
                  );
                },
              },
              {
                key: "description",
                label: "Report Title",
                render: (r) => {
                  const info = createReportInfo(r, tenantName);

                  return (
                    <button
                      type="button"
                      onClick={() => setSelectedReport(r)}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                    >
                      {info.heading}
                    </button>
                  );
                },
              },
              {
                key: "actions",
                label: "Action",
                render: (r) => (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError("");
                      setReportToDelete(r);
                    }}
                    className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="Delete report"
                    aria-label="Delete revenue report"
                  >
                    <Trash2 size={14} />
                  </button>
                ),
              },
            ]}
            rows={reports}
            emptyMessage="No revenue reports submitted yet."
          />
        )}
      </div>

      {/* Submit Revenue Report Modal */}
      <Modal
        open={showSubmit}
        onClose={() => {
          if (!submitting) setShowSubmit(false);
        }}
        title="Submit Revenue Report"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Tenant Name</label>
            <input
              type="text"
              className="input bg-slate-50"
              value={tenantName || ""}
              readOnly
              placeholder="Loading tenant details..."
            />
          </div>

          <div>
            <label className="label">Report Date</label>
            <input
              type="date"
              className="input"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="label">Report Heading</label>
            <input
              type="text"
              className="input"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="e.g. September 2026 Revenue Report"
              maxLength={150}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="label">Report Details</label>
            <textarea
              className="input min-h-48"
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Write your complete revenue report here..."
              disabled={submitting}
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            onClick={handleSubmit}
            disabled={
              submitting ||
              !tenantName?.trim() ||
              !heading.trim() ||
              !reportDate ||
              !reportDetails.trim()
            }
            className="btn-primary w-full disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </Modal>

      {/* View Complete Revenue Report Modal */}
      <Modal
        open={selectedReport !== null}
        onClose={() => setSelectedReport(null)}
        title="Revenue Report"
        size="lg"
      >
        {selectedReport &&
          (() => {
            const info = createReportInfo(selectedReport, tenantName);

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Tenant Name</p>
                    <p className="font-medium text-slate-800">
                      {info.tenantName}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Report Date</p>
                    <p className="font-medium text-slate-800">
                      {info.reportDate || "-"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3">
                    {info.heading}
                  </h2>

                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                    {info.details || "No additional report details."}
                  </p>
                </div>
              </div>
            );
          })()}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={reportToDelete !== null}
        onClose={() => {
          if (!deleting) {
            setReportToDelete(null);
            setDeleteError("");
          }
        }}
        title="Delete Revenue Report"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this revenue report?
          </p>

          {reportToDelete && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="font-medium text-slate-800">
                {createReportInfo(reportToDelete, tenantName).heading}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Report Date:{" "}
                {createReportInfo(reportToDelete, tenantName).reportDate || "-"}
              </p>
            </div>
          )}

          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setReportToDelete(null);
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

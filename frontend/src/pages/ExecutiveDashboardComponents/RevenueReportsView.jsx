import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader, DataTable } from "@/components/ui/index.jsx";
import Modal from "@/components/ui/Modal.jsx";
import { apiGetAllRevenueReports, apiGetTenantById } from "@/lib/api.js";

// Extract heading, report date, tenant name and details
// from the description stored by the Tenant Revenue page.
function parseRevenueDescription(description) {
  const lines = String(description || "").split(/\r?\n/);

  const reportDateMatch = /^Report Date:\s*(.*)$/.exec(lines[1]?.trim() || "");

  const tenantNameMatch = /^Tenant Name:\s*(.*)$/.exec(lines[2]?.trim() || "");

  const hasMetadata = reportDateMatch && tenantNameMatch;

  if (hasMetadata) {
    return {
      heading: lines[0].trim() || "Untitled Report",
      reportDate: reportDateMatch[1].trim(),
      embeddedTenantName: tenantNameMatch[1].trim(),
      details: lines.slice(4).join("\n").trim(),
    };
  }

  // Backward compatibility with older reports.
  return {
    heading: lines[0]?.trim() || "Untitled Report",
    reportDate: "",
    embeddedTenantName: "",
    details: lines.slice(1).join("\n").trim(),
  };
}

export default function RevenueReportsView({ mallId }) {
  const [reports, setReports] = useState([]);
  const [tenantNames, setTenantNames] = useState({});

  const [selectedTenant, setSelectedTenant] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedReport, setSelectedReport] = useState(null);

  // Fetch all reports and then fetch the corresponding tenant names.
  const fetchReports = useCallback(
    async (isCancelled = () => false) => {
      try {
        setLoading(true);
        setError("");

        // Fetch all reports, optionally restricted to a mall.
        const data = await apiGetAllRevenueReports(mallId ? { mallId } : {});

        if (!Array.isArray(data)) {
          throw new Error("Invalid revenue reports response.");
        }

        if (isCancelled()) return;

        setReports(data);

        // Extract unique tenant IDs.
        const tenantIds = [
          ...new Set(
            data
              .map((report) => report.tenant_id)
              .filter((id) => id != null)
              .map(String),
          ),
        ];

        // Fetch tenant profiles concurrently, once per tenant.
        const tenantEntries = await Promise.all(
          tenantIds.map(async (tenantId) => {
            try {
              const tenant = await apiGetTenantById(tenantId);

              return [tenantId, tenant?.business_name || ""];
            } catch (err) {
              console.error(`Failed to fetch tenant ${tenantId}:`, err);

              return [tenantId, ""];
            }
          }),
        );

        if (isCancelled()) return;

        setTenantNames(Object.fromEntries(tenantEntries));
      } catch (err) {
        console.error("Failed to fetch revenue reports:", err);

        if (!isCancelled()) {
          setError(err.message || "Failed to load revenue reports.");
        }
      } finally {
        if (!isCancelled()) {
          setLoading(false);
        }
      }
    },
    [mallId],
  );

  useEffect(() => {
    let cancelled = false;

    fetchReports(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [fetchReports]);

  // Get the tenant name for a report.
  const getTenantName = useCallback(
    (report) => {
      const tenantId = String(report.tenant_id);

      const embeddedName = parseRevenueDescription(
        report.description,
      ).embeddedTenantName;

      return tenantNames[tenantId] || embeddedName || `Tenant ${tenantId}`;
    },
    [tenantNames],
  );

  // Extract unique tenants from the reports.
  const tenants = useMemo(() => {
    const tenantMap = new Map();

    reports.forEach((report) => {
      const id = String(report.tenant_id);

      if (!report.tenant_id) return;

      tenantMap.set(id, {
        id,
        name: getTenantName(report),
      });
    });

    return Array.from(tenantMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [reports, getTenantName]);

  // Filter reports by tenant.
  const filteredReports = useMemo(() => {
    if (selectedTenant === "all") {
      return reports;
    }

    return reports.filter(
      (report) => String(report.tenant_id) === selectedTenant,
    );
  }, [reports, selectedTenant]);

  // Number of tenants represented in the current view.
  const tenantsInView = new Set(
    filteredReports.map((report) => String(report.tenant_id)),
  ).size;

  // Find the latest report date from the description metadata.
  const latestReportDate =
    filteredReports
      .map((report) => parseRevenueDescription(report.description).reportDate)
      .filter(Boolean)
      .sort()
      .at(-1) || "-";

  // Sort reports by report date, newest first.
  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      const dateA = parseRevenueDescription(a.description).reportDate;
      const dateB = parseRevenueDescription(b.description).reportDate;

      return dateB.localeCompare(dateA);
    });
  }, [filteredReports]);

  return (
    <div>
      <PageHeader
        title="Revenue Reports"
        subtitle="View revenue reports submitted by all tenants"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Reports Submitted</p>

          <p className="text-xl font-bold text-slate-900">
            {loading ? "..." : filteredReports.length}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Tenants Reporting</p>

          <p className="text-xl font-bold text-slate-900">
            {loading ? "..." : tenantsInView}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Latest Report Date</p>

          <p className="text-xl font-bold text-slate-900">
            {loading ? "..." : latestReportDate}
          </p>
        </div>
      </div>

      {/* Tenant Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setSelectedTenant("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            selectedTenant === "all"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
          }`}
        >
          All Tenants
        </button>

        {tenants.map((tenant) => (
          <button
            key={tenant.id}
            onClick={() => setSelectedTenant(tenant.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedTenant === tenant.id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {tenant.name}
          </button>
        ))}
      </div>

      {/* Revenue Reports Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading revenue reports...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600 mb-3">{error}</p>

            <button
              onClick={() => fetchReports()}
              className="text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "tenant",
                label: "Tenant",
                render: (r) => (
                  <span className="font-medium text-slate-800">
                    {getTenantName(r)}
                  </span>
                ),
              },
              {
                key: "report_date",
                label: "Report Date",
                render: (r) => {
                  const info = parseRevenueDescription(r.description);

                  return (
                    <span className="text-slate-500">
                      {info.reportDate || "-"}
                    </span>
                  );
                },
              },
              {
                key: "description",
                label: "Report",
                render: (r) => {
                  const info = parseRevenueDescription(r.description);

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
            ]}
            rows={sortedReports}
            emptyMessage={
              selectedTenant === "all"
                ? "No revenue reports have been submitted yet."
                : "This tenant has not submitted any revenue reports yet."
            }
          />
        )}
      </div>

      {/* Complete Revenue Report Modal */}
      <Modal
        open={selectedReport !== null}
        onClose={() => setSelectedReport(null)}
        title="Revenue Report"
        size="lg"
      >
        {selectedReport &&
          (() => {
            const info = parseRevenueDescription(selectedReport.description);

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Tenant Name</p>

                    <p className="font-medium text-slate-800">
                      {getTenantName(selectedReport)}
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
    </div>
  );
}

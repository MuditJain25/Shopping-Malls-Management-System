import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader, DataTable } from "@/components/ui/index.jsx";
// import { apiGetAllRevenueReports } from "@/lib/api.js";

// Supports common backend naming conventions.
const getStoreId = (report) =>
  String(
    report.store_id ??
      report.storeId ??
      report.store?.store_id ??
      report.store?.id ??
      report.store_name ??
      report.storeName ??
      "",
  );

const getStoreName = (report) =>
  report.store_name ??
  report.storeName ??
  report.store?.store_name ??
  report.store?.name ??
  "Unknown Store";

export default function RevenueReports() {
  const [reports, setReports] = useState([]);
  const [selectedStore, setSelectedStore] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // const fetchReports = useCallback(async () => {
  //   try {
  //     setLoading(true);
  //     setError("");

  //     const data = await apiGetAllRevenueReports();

  //     const rows = Array.isArray(data) ? data : data?.reports;

  //     if (!Array.isArray(rows)) {
  //       throw new Error("Invalid revenue reports response.");
  //     }

  //     setReports(rows);
  //   } catch (err) {
  //     console.error("Failed to fetch revenue reports:", err);
  //     setError(err.message || "Failed to load revenue reports.");
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  // useEffect(() => {
  //   fetchReports();
  // }, [fetchReports]);

  // Get unique stores from all submitted reports.
  const stores = useMemo(() => {
    const storeMap = new Map();

    reports.forEach((report) => {
      const id = getStoreId(report);
      const name = getStoreName(report);

      if (id && name !== "Unknown Store") {
        storeMap.set(id, { id, name });
      }
    });

    return Array.from(storeMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [reports]);

  // Filter reports according to selected store.
  const filteredReports = useMemo(() => {
    if (selectedStore === "all") {
      return reports;
    }

    return reports.filter((report) => getStoreId(report) === selectedStore);
  }, [reports, selectedStore]);

  const storesInView = new Set(filteredReports.map(getStoreId).filter(Boolean))
    .size;

  const latestSubmission =
    filteredReports
      .map((report) => report.submitted_date ?? report.submittedDate ?? "")
      .filter(Boolean)
      .sort()
      .at(-1) || "-";

  return (
    <div>
      <PageHeader
        title="Revenue Reports"
        subtitle="View revenue reports submitted by all stores"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Reports Submitted</p>
          <p className="text-xl font-bold text-slate-900">
            {loading ? "..." : filteredReports.length}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Stores Reporting</p>
          <p className="text-xl font-bold text-slate-900">
            {loading ? "..." : storesInView}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Latest Submission</p>
          <p className="text-xl font-bold text-slate-900">
            {loading ? "..." : latestSubmission}
          </p>
        </div>
      </div>

      {/* Store filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setSelectedStore("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            selectedStore === "all"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
          }`}
        >
          All Stores
        </button>

        {stores.map((store) => (
          <button
            key={store.id}
            onClick={() => setSelectedStore(store.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedStore === store.id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {store.name}
          </button>
        ))}
      </div>

      {/* Reports table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading revenue reports...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600 mb-3">{error}</p>

            <button
              // onClick={fetchReports}
              className="text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "store",
                label: "Store",
                render: (r) => (
                  <span className="font-medium text-slate-800">
                    {getStoreName(r)}
                  </span>
                ),
              },
              {
                key: "description",
                label: "Description",
                render: (r) => (
                  <span className="text-slate-600">{r.description || "-"}</span>
                ),
              },
              {
                key: "submitted_date",
                label: "Submitted",
                render: (r) => (
                  <span className="text-slate-500">
                    {r.submitted_date ?? r.submittedDate ?? "-"}
                  </span>
                ),
              },
            ]}
            rows={filteredReports}
            emptyMessage={
              selectedStore === "all"
                ? "No revenue reports have been submitted yet."
                : "This store has not submitted any revenue reports yet."
            }
          />
        )}
      </div>
    </div>
  );
}

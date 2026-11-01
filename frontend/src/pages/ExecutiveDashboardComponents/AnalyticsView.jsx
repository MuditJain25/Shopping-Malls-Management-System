import { useState, useEffect } from "react";
import { PageHeader, DataTable } from "@/components/ui/index.jsx";
import { apiGetCounts, apiGetMalls } from "@/lib/api.js";

// Extract count rows.
function getMallRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.malls)) return data.malls;
  if (Array.isArray(data?.data)) return data.data;

  throw new Error("Invalid mall analytics response.");
}

// Extract mall ID.
function getMallId(row) {
  return row.mall_id ?? row.mallId ?? row.mall?.mall_id ?? row.mall?.id;
}

// Resolve mall name using the mall records.
function getMallName(row, mallsById) {
  const mallId = getMallId(row);

  return (
    mallsById.get(String(mallId)) ??
    row.mall_name ??
    row.mallName ??
    row.mall?.mall_name ??
    row.mall?.name ??
    "Unknown Mall"
  );
}

// Extract count values.
function getCount(row, field) {
  const singular = field.slice(0, -1);

  const value =
    row[field] ??
    row[`${field}_count`] ??
    row[`${field}_counts`] ??
    row[`${field}Count`] ??
    row[`${singular}_count`] ??
    row[`${singular}Count`] ??
    row.counts?.[field] ??
    row.counts?.[singular] ??
    0;

  const count = Number(value);
  return Number.isFinite(count) ? count : 0;
}

export default function AnalyticsView() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        // Fetch mall names and grouped counts together.
        const [malls, countsData] = await Promise.all([
          apiGetMalls(),
          apiGetCounts({
            include: ["tenants", "stores", "employees", "products"],
            groupBy: "mall",
          }),
        ]);

        if (cancelled) return;

        if (!Array.isArray(malls)) {
          throw new Error("Invalid malls response.");
        }

        // Map mall ID to mall name.
        const mallsById = new Map(
          malls.map((mall) => [String(mall.mall_id), mall.mall_name]),
        );

        const rows = getMallRows(countsData);

        const formattedRows = rows.map((row) => ({
          mall_id: getMallId(row),
          mall_name: getMallName(row, mallsById),
          tenants: getCount(row, "tenants"),
          stores: getCount(row, "stores"),
          employees: getCount(row, "employees"),
          products: getCount(row, "products"),
        }));

        // Sort alphabetically by mall name.
        formattedRows.sort((a, b) => a.mall_name.localeCompare(b.mall_name));

        setAnalytics(formattedRows);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load mall analytics:", err);
          setError(err.message || "Failed to load mall analytics.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Mall Performance Analytics"
        subtitle="Tenants, stores, employees, and products across all malls"
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading mall analytics...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600 mb-3">{error}</p>

            <button
              onClick={() => window.location.reload()}
              className="text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "mall_name",
                label: "Mall",
                render: (r) => (
                  <span className="font-medium text-slate-800">
                    {r.mall_name}
                  </span>
                ),
              },
              {
                key: "tenants",
                label: "Tenants",
                render: (r) => r.tenants.toLocaleString(),
              },
              {
                key: "stores",
                label: "Stores",
                render: (r) => r.stores.toLocaleString(),
              },
              {
                key: "employees",
                label: "Employees",
                render: (r) => r.employees.toLocaleString(),
              },
              {
                key: "products",
                label: "Products",
                render: (r) => r.products.toLocaleString(),
              },
            ]}
            rows={analytics}
            emptyMessage="No mall analytics available."
          />
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Store,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  PageHeader,
  LoadingSpinner,
  ErrorState,
} from "@/components/ui/index.jsx";

import {
  apiGetMalls,
  apiGetStores,
  apiGetTenants,
  apiGetTransactionsByMall,
  apiGetEmployeesByMall,
} from "@/lib/api.js";

export default function AnalyticsView() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [expandedMalls, setExpandedMalls] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const malls = await apiGetMalls();

        const results = await Promise.all(
          malls.map(async (mall) => {
            const [transactions, tenants, stores, employees] =
              await Promise.all([
                apiGetTransactionsByMall(mall.mall_id),
                apiGetTenants(mall.mall_id),
                apiGetStores(mall.mall_id),
                apiGetEmployeesByMall(mall.mall_id),
              ]);

            const occupiedStores = stores.filter(
              (store) => store.status === "occupied",
            );

            const totalRevenue = transactions.reduce((sum, transaction) => {
              const amount = Number(transaction.amount ?? 0);
              return sum + (Number.isFinite(amount) ? amount : 0);
            }, 0);

            return {
              mall,
              totalRevenue,
              customerCount: null,
              avgRevenuePerStore: occupiedStores.length
                ? Math.round(totalRevenue / occupiedStores.length)
                : 0,
              partnerCount: tenants.length,
              employeeCount: employees.length,
            };
          }),
        );

        if (!cancelled) {
          setAnalytics(results);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load mall analytics.");
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleMall = (mallId) => {
    setExpandedMalls((previous) =>
      previous.includes(mallId)
        ? previous.filter((id) => id !== mallId)
        : [...previous, mallId],
    );
  };

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!analytics) {
    return <LoadingSpinner label="Loading mall analytics..." />;
  }

  return (
    <div>
      <PageHeader
        title="Mall Performance Analytics"
        subtitle="Revenue, customers, and partner metrics per mall"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {analytics.map((item) => {
          const {
            mall,
            totalRevenue,
            customerCount,
            avgRevenuePerStore,
            partnerCount,
            employeeCount,
          } = item;

          const isExpanded = expandedMalls.includes(mall.mall_id);

          const location = [mall.city, mall.state].filter(Boolean).join(", ");

          const mallName =
            mall.mall_name && mall.mall_name !== mall.city
              ? mall.mall_name
              : location || `Mall ${mall.mall_id}`;

          const showLocation = location && location !== mallName;

          return (
            <div key={mall.mall_id} className="card p-4">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 text-left"
                onClick={() => toggleMall(mall.mall_id)}
                aria-expanded={isExpanded}
                aria-controls={`mall-analytics-${mall.mall_id}`}
                aria-label={`${isExpanded ? "Collapse" : "Expand"} analytics for ${mallName}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 size={18} className="text-brand-600 shrink-0" />

                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {mallName}
                    </h3>

                    {showLocation && (
                      <p className="text-xs text-slate-400">{location}</p>
                    )}
                  </div>
                </div>

                {isExpanded ? (
                  <ChevronUp size={18} className="text-slate-500 shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-slate-500 shrink-0" />
                )}
              </button>

              <div
                id={`mall-analytics-${mall.mall_id}`}
                className={`space-y-2 mt-3 ${isExpanded ? "" : "hidden"}`}
              >
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <DollarSign size={14} />
                    Revenue
                  </span>

                  <span className="font-bold text-slate-900 text-sm">
                    ${totalRevenue.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <Users size={14} />
                    Customers
                  </span>

                  <span
                    className="font-bold text-slate-900 text-sm"
                    title="Customer counts are not currently available from the backend."
                  >
                    {customerCount === null
                      ? "N/A"
                      : customerCount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <TrendingUp size={14} />
                    Avg/Store
                  </span>

                  <span className="font-bold text-slate-900 text-sm">
                    ${avgRevenuePerStore.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <Store size={14} />
                    Partners
                  </span>

                  <span className="font-bold text-slate-900 text-sm">
                    {partnerCount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <Users size={14} />
                    Employees
                  </span>

                  <span className="font-bold text-slate-900 text-sm">
                    {employeeCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {analytics.length === 0 && (
        <div className="card p-6 text-center text-slate-500 text-sm">
          No malls found.
        </div>
      )}
    </div>
  );
}

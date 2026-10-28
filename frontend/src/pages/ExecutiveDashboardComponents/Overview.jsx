import { useEffect, useState } from "react";
import { Building2, Users, Store, Gavel } from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import {
  PageHeader,
  StatCard,
  Badge,
  LoadingSpinner,
} from "@/components/ui/index.jsx";

import {
  apiGetMalls,
  apiGetManagers,
  apiGetTenants,
  apiGetBidEvents,
  apiGetStores,
} from "@/lib/api";

export default function Overview() {
  const { user } = useAuth();

  const [overview, setOverview] = useState({
    malls: [],
    managers: [],
    tenants: [],
    bidEvents: [],
    stores: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setLoading(true);
      setError("");

      try {
        const [malls, managers, tenants, bidEvents, stores] = await Promise.all(
          [
            apiGetMalls(),
            apiGetManagers(),
            apiGetTenants(),
            apiGetBidEvents(),
            apiGetStores(),
          ],
        );

        if (cancelled) return;

        setOverview({
          malls: Array.isArray(malls) ? malls : [],
          managers: Array.isArray(managers) ? managers : [],
          tenants: Array.isArray(tenants) ? tenants : [],
          bidEvents: Array.isArray(bidEvents) ? bidEvents : [],
          stores: Array.isArray(stores) ? stores : [],
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load executive overview.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          title={`Welcome, ${user?.firstName || "Executive"}`}
          subtitle="Enterprise-wide overview across all malls"
        />

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load the executive overview: {error}
        </div>
      </div>
    );
  }

  const { malls, managers, tenants, bidEvents, stores } = overview;

  const openEvents = bidEvents.filter(
    (event) => String(event.status).toLowerCase() === "open",
  );

  const storesById = new Map(
    stores.map((store) => [String(store.store_id ?? store.storeId), store]),
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const getManagerName = (manager) => {
    if (!manager) return "Unassigned";

    const firstName = manager.first_name ?? manager.firstName ?? "";
    const lastName = manager.last_name ?? manager.lastName ?? "";

    const fullName = `${firstName} ${lastName}`.trim();

    return (
      fullName ||
      manager.manager_name ||
      manager.managerName ||
      manager.name ||
      "Unassigned"
    );
  };

  const getMallName = (mall) =>
    mall.mall_name ||
    mall.mallName ||
    mall.name ||
    (mall.city ? `${mall.city} Mall` : `Mall ${mall.mall_id}`);

  const getWinningBidAmount = (event) => {
    const winningBid = event.winningBid ?? event.winning_bid;

    return (
      winningBid?.bid_amount ??
      winningBid?.bidAmount ??
      event.minimum_bid_amount ??
      event.minimumBidAmount ??
      0
    );
  };

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.firstName || "Executive"}`}
        subtitle="Enterprise-wide overview across all malls"
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Total Malls"
          value={malls.length}
          color="brand"
        />

        <StatCard
          icon={Users}
          label="Managers"
          value={managers.length}
          color="success"
        />

        <StatCard
          icon={Store}
          label="Tenants"
          value={tenants.length}
          color="accent"
        />

        <StatCard
          icon={Gavel}
          label="Active Bids"
          value={openEvents.length}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Malls Under Oversight
          </h3>

          <div className="space-y-2">
            {malls.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">No malls found.</p>
            ) : (
              malls.map((mall) => {
                const mallId = String(mall.mall_id ?? mall.mallId);

                const manager = managers.find(
                  (item) => String(item.mall_id ?? item.mallId) === mallId,
                );

                return (
                  <div
                    key={mallId}
                    className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Building2
                        size={14}
                        className="shrink-0 text-slate-400"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {getMallName(mall)}
                        </p>

                        <p className="text-xs text-slate-400">
                          {[mall.city, mall.state].filter(Boolean).join(", ") ||
                            "Location unavailable"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-slate-400">Manager</p>

                      <p className="text-sm font-medium text-slate-700">
                        {getManagerName(manager)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Bid Events Summary
          </h3>

          <div className="space-y-2">
            {bidEvents.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">
                No bid events found.
              </p>
            ) : (
              bidEvents.map((event) => {
                const store = storesById.get(
                  String(event.store_id ?? event.storeId),
                );

                const status = String(event.status || "").toLowerCase();

                const startDate = event.start_date ?? event.startDate ?? "";

                const endDate = event.end_date ?? event.endDate ?? "";

                return (
                  <div
                    key={event.event_id ?? event.eventId}
                    className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {store?.store_name ??
                          store?.storeName ??
                          "Unknown store"}
                      </p>

                      <p className="text-xs text-slate-400">
                        {startDate || "N/A"} → {endDate || "N/A"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(getWinningBidAmount(event))}
                      </p>

                      <Badge
                        variant={status === "open" ? "success" : "neutral"}
                      >
                        {event.status || "Unknown"}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

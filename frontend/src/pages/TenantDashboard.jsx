import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import { useRouter } from "@/context/RouterContext.jsx";
import { LoadingSpinner } from "@/components/ui/index.jsx";
import { apiGetStoresByTenant } from "@/lib/api";
import { getStoresByTenant, getStoreById, stores } from "@/lib/mockData.js";

import Overview from "./TenantDashboardComponents/Overview";
import StoresView from "./TenantDashboardComponents/StoresView";
import ProductsView from "./TenantDashboardComponents/ProductsView";
import EmployeesView from "./TenantDashboardComponents/EmployeesView";
import LeaveView from "./TenantDashboardComponents/LeaveView";
import TransactionsView from "./TenantDashboardComponents/TransactionsView";
import RevenueView from "./TenantDashboardComponents/RevenueView";

export default function TenantDashboard({ role = "tenant" }) {
  const { user } = useAuth();
  const { route } = useRouter();

  const isShopManager = role === "shop_manager";
  const tenantId = isShopManager ? null : user?.profileId;

  const [tenantStores, setTenantStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(!isShopManager);
  const [storesError, setStoresError] = useState("");

  useEffect(() => {
    if (isShopManager || !tenantId) return;

    let cancelled = false;

    setStoresLoading(true);
    setStoresError("");

    apiGetStoresByTenant(tenantId)
      .then((data) => {
        if (!cancelled) {
          setTenantStores(
            Array.isArray(data) ? data : (data?.content ?? data?.items ?? []),
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStoresError(error.message || "Failed to load stores");
        }
      })
      .finally(() => {
        if (!cancelled) setStoresLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isShopManager, tenantId]);

  if (!user) return <LoadingSpinner />;

  if (storesLoading) return <LoadingSpinner />;

  if (storesError) {
    return (
      <div className="p-6 text-sm text-red-600">
        Could not load stores: {storesError}
      </div>
    );
  }

  const allStores = isShopManager
    ? [getStoreById("s1")].filter(Boolean)
    : tenantStores;

  const shopManagerStore = isShopManager
    ? stores.find((s) => s.store_id === "s1")
    : null;

  const activeStores = isShopManager
    ? [shopManagerStore].filter(Boolean)
    : allStores;

  const pageKey =
    route.split("/").pop() || (isShopManager ? "shop-manager" : "tenant");

  if (
    pageKey === (isShopManager ? "shop-manager" : "tenant") ||
    pageKey === ""
  ) {
    return <Overview role={role} stores={activeStores} tenantId={tenantId} />;
  }
  if (pageKey === "stores" || pageKey === "store") {
    return <StoresView stores={activeStores} role={role} />;
  }
  if (pageKey === "products") {
    return <ProductsView stores={activeStores} role={role} />;
  }
  if (pageKey === "employees") {
    return (
      <EmployeesView
        stores={activeStores}
        role={role}
        profileId={user?.profileId}
      />
    );
  }
  if (pageKey === "leave" && isShopManager) {
    return <LeaveView stores={activeStores} />;
  }
  if (pageKey === "transactions") {
    return (
      <TransactionsView
        tenantId={tenantId}
        isShopManager={isShopManager}
        stores={activeStores}
      />
    );
  }
  if (pageKey === "revenue") {
    return <RevenueView tenantId={tenantId} />;
  }
  return <Overview role={role} stores={activeStores} tenantId={tenantId} />;
}

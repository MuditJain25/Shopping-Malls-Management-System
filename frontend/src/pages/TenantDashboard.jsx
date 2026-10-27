import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import { useRouter } from "@/context/RouterContext.jsx";
import { LoadingSpinner } from "@/components/ui/index.jsx";
import { apiGetStoresByTenant, apiGetStoreById } from "@/lib/api";

import Overview from "./TenantDashboardComponents/Overview";
import StoresView from "./TenantDashboardComponents/StoresView";
import ProductsView from "./TenantDashboardComponents/ProductsView";
import EmployeesView from "./TenantDashboardComponents/EmployeesView";
import LeaveView from "./TenantDashboardComponents/LeaveView";
import TransactionsView from "./TenantDashboardComponents/TransactionsView";
import RevenueView from "./TenantDashboardComponents/RevenueView";

const SHOP_MANAGER_STORE_ID = 1;

export default function TenantDashboard({ role = "tenant" }) {
  const { user } = useAuth();
  const { route } = useRouter();

  const isShopManager = role === "shop_manager";
  const profileId = user?.profileId;

  const [tenantStores, setTenantStores] = useState([]);
  const [shopManagerStore, setShopManagerStore] = useState(null);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState("");

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    setStoresLoading(true);
    setStoresError("");

    if (isShopManager) {
      apiGetStoreById(SHOP_MANAGER_STORE_ID)
        .then((data) => {
          if (!cancelled) {
            setShopManagerStore(data);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setStoresError(error.message || "Failed to load store");
          }
        })
        .finally(() => {
          if (!cancelled) setStoresLoading(false);
        });
    } else {
      if (!profileId) {
        setTenantStores([]);
        setStoresLoading(false);
        return () => {
          cancelled = true;
        };
      }

      apiGetStoresByTenant(profileId)
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
    }

    return () => {
      cancelled = true;
    };
  }, [isShopManager, profileId, user]);

  if (!user) return <LoadingSpinner />;

  if (storesLoading) return <LoadingSpinner />;

  if (storesError) {
    return (
      <div className="p-6 text-sm text-red-600">
        Could not load stores: {storesError}
      </div>
    );
  }

  const activeStores = isShopManager
    ? [shopManagerStore].filter(Boolean)
    : tenantStores;

  const pageKey =
    route.split("/").pop() || (isShopManager ? "shop-manager" : "tenant");

  if (
    pageKey === (isShopManager ? "shop-manager" : "tenant") ||
    pageKey === ""
  ) {
    return (
      <Overview
        role={role}
        stores={activeStores}
        tenantId={isShopManager ? null : profileId}
      />
    );
  }

  if (pageKey === "stores" || pageKey === "store") {
    return (
      <StoresView
        stores={activeStores}
        role={role}
        onStoreUpdated={(updatedStore) => {
          if (isShopManager) return;

          setTenantStores((currentStores) =>
            currentStores.map((store) =>
              String(store.store_id) === String(updatedStore.store_id)
                ? { ...store, ...updatedStore }
                : store,
            ),
          );
        }}
      />
    );
  }

  if (pageKey === "products") {
    return <ProductsView stores={activeStores} role={role} />;
  }

  if (pageKey === "employees") {
    return (
      <EmployeesView stores={activeStores} role={role} profileId={profileId} />
    );
  }

  if (pageKey === "leave" && isShopManager) {
    return <LeaveView stores={activeStores} />;
  }

  if (pageKey === "transactions") {
    return (
      <TransactionsView
        tenantId={isShopManager ? null : profileId}
        isShopManager={isShopManager}
        stores={activeStores}
      />
    );
  }

  if (pageKey === "revenue") {
    return <RevenueView tenantId={isShopManager ? null : profileId} />;
  }

  return (
    <Overview
      role={role}
      stores={activeStores}
      tenantId={isShopManager ? null : profileId}
    />
  );
}

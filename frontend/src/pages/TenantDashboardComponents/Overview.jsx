import { useEffect, useState } from "react";
import { Store, Package, Users, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { PageHeader, StatCard, Badge } from "@/components/ui/index.jsx";
import {
  apiGetEmployeesByTenant,
  apiGetProductsByStore,
  apiGetTransactionsByTenant,
  apiGetMallById,
} from "@/lib/api";
import {
  getProductsByStore,
  getEmployeesByStore,
  getMallById,
} from "@/lib/mockData.js";

export default function Overview({ role, stores, tenantId }) {
  const { user } = useAuth();
  const isShopManager = role === "shop_manager";

  const [tenantEmployees, setTenantEmployees] = useState([]);
  const [tenantProducts, setTenantProducts] = useState([]);
  const [tenantTransactions, setTenantTransactions] = useState([]);
  const [tenantMalls, setTenantMalls] = useState({});

  useEffect(() => {
    if (isShopManager || !tenantId) return;

    let cancelled = false;

    apiGetEmployeesByTenant(tenantId)
      .then((data) => {
        if (!cancelled) {
          setTenantEmployees(
            Array.isArray(data) ? data : (data?.content ?? data?.items ?? []),
          );
        }
      })
      .catch((error) => {
        console.error("Failed to load tenant employees:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [isShopManager, tenantId]);

  useEffect(() => {
    if (isShopManager || !tenantId || stores.length === 0) return;

    let cancelled = false;

    Promise.all(
      stores.map(async (store) => {
        const data = await apiGetProductsByStore(store.store_id);

        const products = Array.isArray(data)
          ? data
          : (data?.content ?? data?.items ?? []);

        return products.map((product) => ({
          ...product,
          store_id: store.store_id,
        }));
      }),
    )
      .then((productsByStore) => {
        if (!cancelled) {
          setTenantProducts(productsByStore.flat());
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load tenant products:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isShopManager, tenantId, stores]);

  useEffect(() => {
    if (isShopManager || !tenantId) return;

    let cancelled = false;

    apiGetTransactionsByTenant(tenantId)
      .then((data) => {
        if (!cancelled) {
          setTenantTransactions(
            Array.isArray(data) ? data : (data?.content ?? data?.items ?? []),
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load tenant transactions:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isShopManager, tenantId]);

  useEffect(() => {
    if (isShopManager || !tenantId || stores.length === 0) return;

    let cancelled = false;

    const mallIds = [
      ...new Set(
        stores.map((store) => store.mall_id).filter((id) => id != null),
      ),
    ];

    Promise.all(
      mallIds.map(async (mallId) => {
        const mall = await apiGetMallById(mallId);
        return [String(mallId), mall];
      }),
    )
      .then((entries) => {
        if (!cancelled) {
          setTenantMalls(Object.fromEntries(entries));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load tenant malls:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isShopManager, tenantId, stores]);

  const allEmployees = isShopManager
    ? stores.flatMap((s) => getEmployeesByStore(s.store_id))
    : tenantEmployees;
  const allProducts = isShopManager
    ? stores.flatMap((s) => getProductsByStore(s.store_id))
    : tenantProducts;
  const topProducts = allProducts.filter((p) => p.to_show);
  const transactions = isShopManager ? [] : tenantTransactions;
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.firstName}`}
        subtitle={
          isShopManager
            ? `Managing ${stores[0]?.store_name}`
            : `${stores.length} stores across malls`
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Store}
          label="Active Stores"
          value={stores.length}
          color="brand"
        />
        <StatCard
          icon={Users}
          label="Employees"
          value={allEmployees.length}
          color="success"
        />
        <StatCard
          icon={Package}
          label="Total Products"
          value={allProducts.length}
          color="accent"
        />
        <StatCard
          icon={Star}
          label="Top Selling"
          value={topProducts.length}
          color="warning"
        />
      </div>

      {!isShopManager && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-slate-900 text-sm mb-2">
            Total Rent Paid
          </h3>
          <p className="text-2xl font-bold text-slate-900">
            ${totalRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {transactions.length} transactions
          </p>
        </div>
      )}

      <h3 className="font-semibold text-slate-900 mb-4">Your Stores</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => {
          const mall = isShopManager
            ? getMallById(store.mall_id)
            : tenantMalls[String(store.mall_id)];
          const storeEmps = isShopManager
            ? getEmployeesByStore(store.store_id)
            : tenantEmployees.filter(
                (e) => String(e.store_id) === String(store.store_id),
              );
          const storeProds = isShopManager
            ? getProductsByStore(store.store_id)
            : tenantProducts.filter(
                (p) => String(p.store_id) === String(store.store_id),
              );
          return (
            <div key={store.store_id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Store size={18} className="text-brand-600" />
                  <div>
                    <h4 className="font-medium text-slate-900 text-sm">
                      {store.store_name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {mall?.city} · Floor {store.floor}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={store.status === "occupied" ? "success" : "warning"}
                >
                  {store.status}
                </Badge>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {storeEmps.length} emps
                </span>
                <span className="flex items-center gap-1">
                  <Package size={12} /> {storeProds.length} products
                </span>
                <span className="flex items-center gap-1">
                  <Star size={12} />{" "}
                  {storeProds.filter((p) => p.to_show).length} top
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

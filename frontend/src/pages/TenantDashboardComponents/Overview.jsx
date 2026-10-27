import { useEffect, useState } from "react";
import { Store, Package, Users, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { PageHeader, StatCard, Badge } from "@/components/ui/index.jsx";
import {
  apiGetEmployeesByTenant,
  apiGetEmployeesByStore,
  apiGetProductsByStore,
  apiGetTransactionsByTenant,
  apiGetMallById,
} from "@/lib/api";

export default function Overview({ role, stores, tenantId }) {
  const { user } = useAuth();
  const isShopManager = role === "shop_manager";
  const shopManagerStoreId = isShopManager ? stores[0]?.store_id : null;

  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [malls, setMalls] = useState({});

  useEffect(() => {
    if (isShopManager ? shopManagerStoreId == null : !tenantId) {
      setEmployees([]);
      return;
    }

    let cancelled = false;

    const request = isShopManager
      ? apiGetEmployeesByStore(shopManagerStoreId)
      : apiGetEmployeesByTenant(tenantId);

    request
      .then((data) => {
        if (!cancelled) {
          setEmployees(
            Array.isArray(data) ? data : (data?.content ?? data?.items ?? []),
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load employees:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isShopManager, tenantId, shopManagerStoreId]);

  useEffect(() => {
    if (stores.length === 0) return;

    let cancelled = false;

    Promise.all(
      stores.map(async (store) => {
        const data = await apiGetProductsByStore(store.store_id);

        const storeProducts = Array.isArray(data)
          ? data
          : (data?.content ?? data?.items ?? []);

        return storeProducts.map((product) => ({
          ...product,
          store_id: store.store_id,
        }));
      }),
    )
      .then((productsByStore) => {
        if (!cancelled) {
          setProducts(productsByStore.flat());
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load products:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stores]);

  useEffect(() => {
    if (isShopManager || !tenantId) {
      setTransactions([]);
      return;
    }

    let cancelled = false;

    apiGetTransactionsByTenant(tenantId)
      .then((data) => {
        if (!cancelled) {
          setTransactions(
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
    if (stores.length === 0) return;

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
          setMalls(Object.fromEntries(entries));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load malls:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stores]);

  const topProducts = products.filter((product) => product.to_show);
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
          label={isShopManager ? "Store Status" : "Active Stores"}
          value={
            isShopManager ? (stores[0]?.status ?? "Unknown") : stores.length
          }
          color="brand"
        />
        <StatCard
          icon={Users}
          label="Employees"
          value={employees.length}
          color="success"
        />
        <StatCard
          icon={Package}
          label="Total Products"
          value={products.length}
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

      <h3 className="font-semibold text-slate-900 mb-4">
        {isShopManager ? "Your Store" : "Your Stores"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => {
          const mall = malls[String(store.mall_id)];

          const storeEmployees = employees.filter(
            (employee) => String(employee.store_id) === String(store.store_id),
          );

          const storeProducts = products.filter(
            (product) => String(product.store_id) === String(store.store_id),
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
                  <Users size={12} /> {storeEmployees.length} emps
                </span>
                <span className="flex items-center gap-1">
                  <Package size={12} /> {storeProducts.length} products
                </span>
                <span className="flex items-center gap-1">
                  <Star size={12} />{" "}
                  {storeProducts.filter((p) => p.to_show).length} top
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

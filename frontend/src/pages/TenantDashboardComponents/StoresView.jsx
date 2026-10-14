import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/index.jsx";
import { apiGetMallById } from "@/lib/api";
import { getMallById } from "@/lib/mockData.js";

export default function StoresView({ stores, role }) {
  const isShopManager = role === "shop_manager";

  const [tenantMalls, setTenantMalls] = useState({});

  useEffect(() => {
    if (isShopManager || stores.length === 0) return;

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
          console.error("Failed to load store mall details:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isShopManager, stores]);

  return (
    <div>
      <PageHeader title="My Stores" subtitle="All stores you operate" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stores.map((store) => {
          const mall = isShopManager
            ? getMallById(store.mall_id)
            : tenantMalls[String(store.mall_id)];
          return (
            <div key={store.store_id} className="card overflow-hidden">
              <img
                src={store.listing_media}
                alt={store.store_name}
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 text-sm mb-1">
                  {store.store_name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                  <Building2 size={12} /> {mall?.city}, {mall?.state} · Shop{" "}
                  {store.shop_number}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <p className="text-slate-400 text-xs">Floor</p>
                    <p className="font-medium text-slate-800 text-sm">
                      Floor {store.floor}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <p className="text-slate-400 text-xs">Area</p>
                    <p className="font-medium text-slate-800 text-sm">
                      {store.area_sqft} sqft
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

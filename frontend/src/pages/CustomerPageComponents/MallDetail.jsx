import { useEffect, useState } from "react";
import { ChevronRight, MapPin, Building2 } from "lucide-react";
import { useRouter } from "@/context/RouterContext.jsx";
import { ErrorState, EmptyState, LoadingSpinner } from "@/components/ui/index.jsx";
import {
  apiGetMallById,
  apiGetStoresByMall,
  apiGetTopSellingProducts,
  apiGetAvailableStores,
  apiGetStoreById,
} from "@/lib/api.js";

export default function MallDetail({ mallId, user,navigate }) {
  // const { navigate } = useRouter();
  const [mall, setMall] = useState(null);
  const [stores, setStores] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [storeProducts, setStoreProducts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [m, mallStores, top, avail] = await Promise.all([
          apiGetMallById(mallId),
          apiGetStoresByMall(mallId),
          apiGetTopSellingProducts(mallId),
          apiGetAvailableStores(mallId),
        ]);
        if (cancelled) return;
        setMall(m);
        setStores(mallStores);
        setTopProducts(top);
        setAvailableCount(avail.length);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load mall");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mallId]);

  useEffect(() => {
    if (!selectedStore) {
      setStoreProducts(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setError("");
        const [store, sps] = await Promise.all([
          apiGetStoreById(selectedStore),
          fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"}/stores/${selectedStore}/products`)
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
        ]);
        if (cancelled) return;
        setStoreProducts({ store, products: sps });
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load store");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedStore]);

  if (loading) return <LoadingSpinner label="Loading mall..." />;
  if (error) return <ErrorState message={error} />;
  if (!mall) return <EmptyState title="Mall not found" />;

  const categories = Array.from(
    new Set(topProducts.map((p) => p.category).filter(Boolean)),
  );
  const selectedProducts = storeProducts
    ? (storeProducts.products?.content || storeProducts.products || [])
    : topProducts;
  const visibleCategories = selectedStore
    ? Array.from(
        new Set(
          selectedProducts
            .map((p) => p.category)
            .filter(Boolean),
        ),
      )
    : categories;


  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate(["discover",null])}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronRight size={14} className="rotate-180" /> Back to malls
      </button>

      <div className="relative h-48 rounded-lg overflow-hidden mb-6">
        <img
          src={mall.image_url}
          alt={mall.city}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h1 className="font-bold text-2xl mb-1">{mall.mall_name}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-200">
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {mall.street}, {mall.city}, {mall.state}
            </span>
            <span className="flex items-center gap-1">
              <Building2 size={12} />{" "}
              {(mall.mall_area_sqft / 100000).toFixed(1)}M sqft
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{stores.length}</p>
          <p className="text-xs text-slate-500">Active Stores</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-slate-900">
            {topProducts.length}
          </p>
          <p className="text-xs text-slate-500">Top Products</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{availableCount}</p>
          <p className="text-xs text-slate-500">Available</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-slate-900">
            {mall.contact_numbers?.length || 0}
          </p>
          <p className="text-xs text-slate-500">Contact Lines</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-base font-bold text-slate-900 mb-3">Stores</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {stores.map((store) => (
            <div
              key={store.store_id}
              onClick={() =>
                setSelectedStore(
                  selectedStore === store.store_id ? null : store.store_id,
                )
              }
              className={`card overflow-hidden flex items-center gap-3 p-2 cursor-pointer ${
                selectedStore === store.store_id ? "ring-2 ring-brand-500" : ""
              }`}
            >
              <img
                src={store.listing_media?.[0]}
                alt={store.store_name}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">
                  {store.store_name}
                </p>
                <p className="text-xs text-slate-400">
                  Floor {store.floor} · Shop {store.shop_number}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-base font-bold text-slate-900 mb-3">
          {selectedStore ? "Store Products" : "Top Products"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {selectedProducts.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="No products found"
                message="No products to show."
              />
            </div>
          ) : (
            selectedProducts.map((product) => {
              const pid = product.product_id ?? product.productId;
              const pname = product.product_name ?? product.productName;
              const img = product.imageUrl ?? product.image_url;
              const price = product.price;
              return (
                <div key={pid} className="card overflow-hidden">
                  <div className="relative h-32 overflow-hidden bg-slate-100">
                    <img
                      src={img}
                      alt={pname}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1.5 right-1.5 badge bg-amber-400 text-white">
                      Top
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-slate-400">{product.category}</p>
                    <h3 className="font-medium text-slate-800 text-sm mb-1 line-clamp-1">
                      {pname}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-brand-600 text-sm">
                        ${Number(price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

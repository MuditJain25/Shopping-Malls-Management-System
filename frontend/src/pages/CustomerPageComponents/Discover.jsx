import { useState, useEffect } from 'react';
import { MapPin, Building2, Gavel, Star, Store } from 'lucide-react';

import { useRouter } from '@/context/RouterContext.jsx';
import { PageHeader, StatCard, EmptyState, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import {
  apiGetMalls,
  apiGetStoresByMall,
  apiGetTopSellingProducts,
  apiGetBidEvents,
} from '@/lib/api.js';
import MallDetail from './MallDetail';

export default function Discover({ user }) {
  // const { navigate } = useRouter();
  const [view, setView] = useState(["discover",null])
  const [malls, setMalls] = useState([]);
  const [storeCountByMall, setStoreCountByMall] = useState({});
  const [topByMall, setTopByMall] = useState({});
  const [storeTotal, setStoreTotal] = useState(0);
  const [openBidCount, setOpenBidCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const mallList = await apiGetMalls();
        if (cancelled) return;
        setMalls(mallList);

        const [storesPerMall, topPerMall, openEvents] = await Promise.all([
          Promise.all(mallList.map((m) => apiGetStoresByMall(m.mall_id).catch(() => []))),
          Promise.all(mallList.map((m) => apiGetTopSellingProducts(m.mall_id).catch(() => []))),
          apiGetBidEvents('open').catch(() => []),
        ]);
        if (cancelled) return;

        const counts = {};
        let total = 0;
        mallList.forEach((m, i) => {
          counts[m.mall_id] = storesPerMall[i].length;
          total += storesPerMall[i].length;
        });
        const tops = {};
        mallList.forEach((m, i) => { tops[m.mall_id] = topPerMall[i]; });

        setStoreCountByMall(counts);
        setTopByMall(tops);
        setStoreTotal(total);
        setOpenBidCount(openEvents.length);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load malls');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingSpinner label="Loading malls..." />;
  if (error) return <ErrorState message={error} />;

  const topProductsTotal = Object.values(topByMall).reduce((s, arr) => s + arr.length, 0);
  const allTopProducts = malls.flatMap((m) => topByMall[m.mall_id] || []).slice(0, 8);

  if(view[0] == 'malldetail' && view[1] !== null){
    return (
      <MallDetail user={user} mallId={1} navigate={setView} ></MallDetail>

    )
  }

  return (
    <div>
      <PageHeader title={`Welcome, ${user.firstName}`} subtitle="Discover malls, brands, and properties near you" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Malls" value={malls.length} color="brand" />
        <StatCard icon={Store} label="Stores" value={storeTotal} color="success" />
        <StatCard icon={Gavel} label="Open Bids" value={openBidCount} color="warning" />
        <StatCard icon={Star} label="Top Products" value={topProductsTotal} color="accent" />
      </div>

      <h3 className="font-semibold text-slate-900 mb-4">Malls Near You</h3>
      {malls.length === 0 ? (
        <EmptyState title="No malls found" message="Check back later." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {malls.map(mall => {
            const storeCount = storeCountByMall[mall.mall_id] ?? 0;
            return (
              <button type="button" key={mall.mall_id} onClick={() => {setView(["malldetail",mall.mall_id])}} className="card overflow-hidden hover:shadow-md transition-shadow cursor-pointer text-left">
                <div className="relative h-36 overflow-hidden">
                  <img src={mall.image_url} alt={mall.city} className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-3 text-white text-xs flex items-center gap-1">
                    <MapPin size={12} /> {mall.city}, {mall.state}
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">{mall.mall_name}</h4>
                  <p className="text-xs text-slate-400 mb-2 line-clamp-2">{mall.description}</p>
                  <div className="flex gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Building2 size={12} /> {storeCount} stores</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* <h3 className="font-semibold text-slate-900 mb-4">Top Products Across Malls</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"> */}
        {/* {allTopProducts.map(product => (
          <div key={product.product_id} className="card overflow-hidden">
            <div className="relative h-28 overflow-hidden bg-slate-100">
              <img src={product.imageUrl} alt={product.product_name} className="w-full h-full object-cover" />
              <span className="absolute top-1.5 right-1.5 badge bg-amber-400 text-white">Top</span>
            </div>
            <div className="p-2.5">
              <p className="text-xs text-slate-400">{product.category}</p>
              <h4 className="font-medium text-slate-800 text-sm line-clamp-1">{product.product_name}</h4>
              <p className="font-semibold text-brand-600 text-sm">${Number(product.price).toFixed(2)}</p>
            </div>
          </div>
        ))} */}
      {/* </div> */}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { MapPin, Gavel } from 'lucide-react';
import { useRouter } from '@/context/RouterContext.jsx';
import { PageHeader, EmptyState, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import { apiGetAvailableStores, apiGetMalls, apiGetBidEvents } from '@/lib/api.js';

export default function Properties({ user }) {
  const { navigate } = useRouter();
  const [stores, setStores] = useState([]);
  const [mallById, setMallById] = useState({});
  const [eventByStore, setEventByStore] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const [available, mallList, openEvents] = await Promise.all([
          apiGetAvailableStores(),
          apiGetMalls().catch(() => []),
          apiGetBidEvents('open').catch(() => []),
        ]);
        if (cancelled) return;
        setStores(available);
        const malls = {};
        mallList.forEach((m) => { malls[m.mall_id] = m; });
        setMallById(malls);
        const byStore = {};
        openEvents.forEach((e) => { byStore[e.store_id] = e; });
        setEventByStore(byStore);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load properties');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingSpinner label="Loading properties..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader title="Explore Properties" subtitle="Available retail spaces for lease" />
      {stores.length === 0 ? (
        <EmptyState title="No properties available" message="Check back later for new listings." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map(store => {
            const mall = mallById[store.mall_id];
            const event = eventByStore[store.store_id];
            const winningBid = event?.winningBid;
            const highest = winningBid?.bid_amount ?? event?.minimum_bid_amount;
            const image = store.listing_media?.[0];
            return (
              <div key={store.store_id} className="card overflow-hidden">
                <div className="relative h-36 overflow-hidden">
                  {image && <img src={image} alt={store.store_name} className="w-full h-full object-cover" />}
                  <span className="absolute top-2 left-2 badge bg-green-500 text-white">Available</span>
                  {event && <span className="absolute top-2 right-2 badge bg-amber-500 text-white">Bidding Open</span>}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <MapPin size={10} /> {mall?.city}, {mall?.state} · Floor {store.floor}
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">{store.store_name}</h4>
                  <p className="text-xs text-slate-500 mb-3">Shop {store.shop_number} · {store.area_sqft} sqft</p>
                  {event && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 mb-3">
                      <div>
                        <p className="text-xs text-slate-500">Highest bid</p>
                        <p className="font-bold text-amber-700 text-sm">${Number(highest || 0).toLocaleString()}</p>
                      </div>
                      <Gavel size={16} className="text-amber-600" />
                    </div>
                  )}
                  <button onClick={() => event ? navigate(`/app/customer/bid/${event.event_id}/store/${store.store_id}`) : navigate(`/app/customer/property/${store.store_id}`)} className="btn-primary w-full text-sm">
                    {event ? 'Join Bidding' : 'View Details'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

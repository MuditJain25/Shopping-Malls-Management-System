import { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Building2, Gavel, Star, ArrowRight, ChevronRight,
  TrendingUp, Trophy, Check, Store
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';
import { PageHeader, StatCard, Badge, EmptyState, LoadingSpinner } from '@/components/ui/index.jsx';
import {
  malls, stores, bidEvents, getBidsByEvent, getWinningBid,
  getMallById, getStoreById, getTopSellingProducts, getStoresByMall,
  bids
} from '@/lib/mockData.js';
import { apiPlaceBid } from '@/lib/api.js';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { route } = useRouter();
  if (!user) return <LoadingSpinner />;
  const pageKey = route.split('/').pop() || 'customer';

  if (pageKey === 'customer') return <Discover user={user} />;
  if (pageKey === 'properties') return <Properties user={user} />;
  if (pageKey === 'bids') return <MyBids user={user} />;
  return <Discover user={user} />;
}

function Discover({ user }) {
  const { navigate } = useRouter();
  return (
    <div>
      <PageHeader title={`Welcome, ${user.firstName}`} subtitle="Discover malls, brands, and properties near you" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Malls" value={malls.length} color="brand" />
        <StatCard icon={Store} label="Stores" value={stores.length} color="success" />
        <StatCard icon={Gavel} label="Open Bids" value={bidEvents.filter(e => e.status === 'open').length} color="warning" />
        <StatCard icon={Star} label="Top Products" value={malls.reduce((s, m) => s + getTopSellingProducts(m.mall_id).length, 0)} color="accent" />
      </div>

      <h3 className="font-semibold text-slate-900 mb-4">Malls Near You</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {malls.map(mall => {
          const mallStores = getStoresByMall(mall.mall_id);
          const topProducts = getTopSellingProducts(mall.mall_id);
          return (
            <div key={mall.mall_id} className="card overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-36 overflow-hidden">
                <img src={mall.imageUrl} alt={mall.city} className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-3 text-white text-xs flex items-center gap-1">
                  <MapPin size={12} /> {mall.city}, {mall.state}
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-slate-900 text-sm mb-1">{mall.city === 'New York' ? 'Heritage Plaza' : mall.city === 'San Jose' ? 'Tech Park Mall' : 'Lakeshore Mall'}</h4>
                <p className="text-xs text-slate-400 mb-2 line-clamp-2">{mall.description}</p>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Building2 size={12} /> {mallStores.length} stores</span>
                  <span className="flex items-center gap-1"><Star size={12} /> {topProducts.length} products</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="font-semibold text-slate-900 mb-4">Top Products Across Malls</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {malls.flatMap(m => getTopSellingProducts(m.mall_id)).slice(0, 8).map(product => (
          <div key={product.product_id} className="card overflow-hidden">
            <div className="relative h-28 overflow-hidden bg-slate-100">
              <img src={product.imageUrl} alt={product.product_name} className="w-full h-full object-cover" />
              <span className="absolute top-1.5 right-1.5 badge bg-amber-400 text-white">Top</span>
            </div>
            <div className="p-2.5">
              <p className="text-xs text-slate-400">{product.category}</p>
              <h4 className="font-medium text-slate-800 text-sm line-clamp-1">{product.product_name}</h4>
              <p className="font-semibold text-brand-600 text-sm">${product.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Properties({ user }) {
  const { navigate } = useRouter();
  const availableStores = stores.filter(s => s.status === 'available');

  return (
    <div>
      <PageHeader title="Explore Properties" subtitle="Available retail spaces for lease" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableStores.map(store => {
          const mall = getMallById(store.mall_id);
          const event = bidEvents.find(be => be.store_id === store.store_id && be.status === 'open');
          const winningBid = event ? getWinningBid(event.event_id) : null;
          return (
            <div key={store.store_id} className="card overflow-hidden">
              <div className="relative h-36 overflow-hidden">
                <img src={store.listing_media[0]} alt={store.store_name} className="w-full h-full object-cover" />
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
                      <p className="font-bold text-amber-700 text-sm">${(winningBid?.bid_amount || event.minimum_bid_amount).toLocaleString()}</p>
                    </div>
                    <Gavel size={16} className="text-amber-600" />
                  </div>
                )}
                <button onClick={() => navigate('/app/customer/bids')} className="btn-primary w-full text-sm">
                  {event ? 'Join Bidding' : 'View Details'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MyBids({ user }) {
  const [refresh, setRefresh] = useState(0);
  const userBids = bids.filter(b => b.user_id === user.id);
  const userBidEvents = userBids.map(b => ({
    bid: b,
    event: bidEvents.find(be => be.event_id === b.event_id),
  })).filter(item => item.event);

  return (
    <div key={refresh}>
      <PageHeader title="My Bids" subtitle="Track your bidding activity" />
      {userBidEvents.length === 0 ? (
        <EmptyState icon={Gavel} title="No bids placed yet" message="Explore properties and join a bidding event to get started." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {userBidEvents.map(({ bid, event }) => {
            const store = getStoreById(event.store_id);
            const mall = store ? getMallById(store.mall_id) : null;
            const currentWinner = getWinningBid(event.event_id);
            const isWinning = bid.status === 'winning';
            return (
              <div key={bid.bid_id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{store?.store_name}</h3>
                    <p className="text-xs text-slate-400">{mall?.city}, {mall?.state}</p>
                  </div>
                  <Badge variant={isWinning ? 'success' : bid.status === 'outbid' ? 'warning' : 'neutral'}>{bid.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-400">Your Bid</p>
                    <p className="font-semibold text-slate-800 text-sm">${bid.bid_amount.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-400">Current Highest</p>
                    <p className="font-semibold text-green-600 text-sm">${(currentWinner?.bid_amount || 0).toLocaleString()}</p>
                  </div>
                </div>
                {isWinning && (
                  <div className="p-2.5 rounded-lg bg-green-50 flex items-center gap-2">
                    <Trophy size={14} className="text-green-600" />
                    <span className="text-sm text-green-700">You are the highest bidder!</span>
                  </div>
                )}
                {!isWinning && event.status === 'open' && (
                  <div className="p-2.5 rounded-lg bg-orange-50 flex items-center gap-2">
                    <TrendingUp size={14} className="text-orange-600" />
                    <span className="text-sm text-orange-700">You've been outbid. Place a higher bid!</span>
                  </div>
                )}
                {event.status === 'finalized' && (
                  <div className="p-2.5 rounded-lg bg-slate-50 text-sm text-slate-600">
                    {event.final_allocation || 'Event finalized'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

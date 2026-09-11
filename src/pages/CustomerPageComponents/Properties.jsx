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

export default function Properties({ user }) {
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
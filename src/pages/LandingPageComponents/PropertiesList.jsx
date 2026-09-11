import React from 'react';
import { ChevronRight, MapPin, Gavel } from 'lucide-react';

import { Badge, ErrorState, EmptyState } from '@/components/ui/index.jsx';
import { getWinningBid, bidEvents,getMallById } from '@/lib/mockData.js';

export default function PropertiesList({ stores, onBack, onOpenBid, user, onSignIn }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronRight size={14} className="rotate-180" /> Back to home
      </button>
      <h1 className="text-lg font-bold text-slate-900 mb-1">Available Properties</h1>
      <p className="text-sm text-slate-500 mb-6">Browse retail spaces available for lease</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stores.length === 0 ? (
          <div className="col-span-full"><EmptyState title="No properties available" message="Check back later for new listings." /></div>
        ) : stores.map(store => {
          const mall = getMallById(store.mall_id);
          const event = bidEvents.find(be => be.store_id === store.store_id && be.status === 'open');
          const winningBid = event ? getWinningBid(event.event_id) : null;
          return (
            <div key={store.store_id} className="card overflow-hidden">
              <div className="relative h-40 overflow-hidden">
                <img src={store.listing_media[0]} alt={store.store_name} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 badge bg-green-500 text-white">Available</span>
                {event && <span className="absolute top-2 right-2 badge bg-amber-500 text-white">Bidding Open</span>}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <MapPin size={10} /> {mall?.city}, {mall?.state} · Floor {store.floor}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{store.store_name}</h3>
                <p className="text-xs text-slate-500 mb-3">Shop {store.shop_number} · {store.area_sqft} sqft</p>
                {event && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 mb-3">
                    <div>
                      <p className="text-xs text-slate-500">Highest bid</p>
                      <p className="font-bold text-amber-700 text-sm">${winningBid?.bid_amount.toLocaleString() || event.minimum_bid_amount.toLocaleString()}</p>
                    </div>
                    <Gavel size={18} className="text-amber-600" />
                  </div>
                )}
                <button onClick={() => onOpenBid(store)} className="btn-primary w-full text-sm">
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
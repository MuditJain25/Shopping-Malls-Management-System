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

export default function MyBids({ user }) {
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
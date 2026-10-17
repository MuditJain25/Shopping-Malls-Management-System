import { useState, useEffect } from 'react';
import { Gavel, Trophy, TrendingUp } from 'lucide-react';
import { PageHeader, Badge, EmptyState, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import {
  apiGetBidEvents,
  apiGetBidsByEvent,
  apiGetMalls,
  apiGetStoreById,
} from '@/lib/api.js';

export default function MyBids({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        // No "bids by user" endpoint, so fan out per event and filter client-side.
        const [events, mallList] = await Promise.all([
          apiGetBidEvents(),
          apiGetMalls().catch(() => []),
        ]);
        if (cancelled) return;
        const malls = {};
        mallList.forEach((m) => { malls[m.mall_id] = m; });

        const bidsPerEvent = await Promise.all(
          events.map((e) => apiGetBidsByEvent(e.event_id).catch(() => [])),
        );
        if (cancelled) return;

        const mine = [];
        events.forEach((event, i) => {
          (bidsPerEvent[i] || [])
            .filter((b) => String(b.user_id) === String(user.id))
            .forEach((bid) => mine.push({ bid, event }));
        });

        const storeIds = [...new Set(mine.map(({ event }) => event.store_id))];
        const storeEntries = await Promise.all(
          storeIds.map(async (id) => {
            try {
              return [id, await apiGetStoreById(id)];
            } catch {
              return [id, null];
            }
          }),
        );
        if (cancelled) return;

        const stores = Object.fromEntries(storeEntries);
        setItems(mine.map(({ bid, event }) => {
          const store = stores[event.store_id] || null;
          return { bid, event, store, mall: store ? malls[store.mall_id] : null };
        }));
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load your bids');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user.id]);

  if (loading) return <LoadingSpinner label="Loading your bids..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader title="My Bids" subtitle="Track your bidding activity" />
      {items.length === 0 ? (
        <EmptyState icon={Gavel} title="No bids placed yet" message="Explore properties and join a bidding event to get started." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map(({ bid, event, store, mall }) => {
            const currentWinner = event.winningBid;
            const isWinning = bid.status === 'winning';
            return (
              <div key={`${bid.event_id}-${bid.bid_id}`} className="card p-4">
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
                    <p className="font-semibold text-slate-800 text-sm">${Number(bid.bid_amount).toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-400">Current Highest</p>
                    <p className="font-semibold text-green-600 text-sm">${Number(currentWinner?.bid_amount || 0).toLocaleString()}</p>
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
                    Event finalized
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

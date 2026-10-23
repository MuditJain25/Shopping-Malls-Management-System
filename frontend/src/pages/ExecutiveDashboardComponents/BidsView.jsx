import { useState, useEffect } from 'react';
import { Trophy, MapPin } from 'lucide-react';
import { PageHeader, Badge, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import { apiGetMalls, apiGetBidEvents, apiGetBidEventsByMall, apiGetBidsByEvent, apiGetStores } from '@/lib/api.js';

export default function BidsView() {
  const [malls, setMalls] = useState([]);
  const [selectedMall, setSelectedMall] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiGetMalls()
      .then(setMalls)
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setData(null);
    (async () => {
      try {
        let events = [];
        if (selectedMall) {
          events = await apiGetBidEventsByMall(selectedMall);
        } else {
          events = await apiGetBidEvents();
        }
        if (cancelled || !events.length) {
          if (!cancelled) setData({ events: [], bidsByEvent: {}, storesById: {} });
          return;
        }
        const [stores, bidsList] = await Promise.all([
          apiGetStores().catch(() => []),
          Promise.all(events.map(ev => apiGetBidsByEvent(ev.event_id).catch(() => []))),
        ]);
        if (cancelled) return;
        const storesById = {};
        (stores || []).forEach(s => { storesById[s.store_id] = s; });
        const bidsByEvent = {};
        events.forEach((ev, i) => { bidsByEvent[ev.event_id] = bidsList[i] || []; });
        setData({ events, bidsByEvent, storesById });
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedMall]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingSpinner label="Loading bid events..." />;

  const { events, bidsByEvent, storesById } = data;

  return (
    <div>
      <PageHeader
        title="Bid Events Overview"
        subtitle="View all bids across malls (read-only)"
        action={
          <select className="input w-auto" value={selectedMall} onChange={e => setSelectedMall(e.target.value)}>
            <option value="">All Malls</option>
            {malls.map(m => <option key={m.mall_id} value={m.mall_id}>{m.mall_name || `${m.city}, ${m.state}`}</option>)}
          </select>
        }
      />
      {events.length === 0 ? (
        <div className="card p-6 text-center text-slate-500 text-sm">No bid events found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map(event => {
            const store = storesById[event.store_id];
            const mall = malls.find(m => m.mall_id === store?.mall_id);
            const bids = [...(bidsByEvent[event.event_id] || [])].sort((a, b) => (b.bid_amount || 0) - (a.bid_amount || 0));
            const winning = event.winningBid || bids.find(b => b.status === 'winning') || bids[0];
            return (
              <div key={event.event_id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{store?.store_name || `Store ${event.store_id}`}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={12} /> {mall ? (mall.mall_name || `${mall.city}, ${mall.state}`) : store?.mall_id ? `Mall ${store.mall_id}` : ''} · {event.start_date} → {event.end_date}
                    </p>
                  </div>
                  <Badge variant={event.status === 'open' ? 'success' : event.status === 'finalized' ? 'neutral' : 'warning'}>{event.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-400">Min Bid</p>
                    <p className="font-semibold text-slate-800 text-sm">${(event.minimum_bid_amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-400">Total Bids</p>
                    <p className="font-semibold text-slate-800 text-sm">{bids.length}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-400">Highest Bid</p>
                    <p className="font-semibold text-green-600 text-sm">${(winning?.bid_amount || event.minimum_bid_amount || 0).toLocaleString()}</p>
                  </div>
                </div>
                {winning && (
                  <div className="p-2.5 rounded-lg bg-green-50 mb-3 flex items-center gap-2">
                    <Trophy size={14} className="text-green-600" />
                    <span className="text-sm text-slate-700">Leading: <span className="font-medium">{winning.bidder_name}</span> — ${winning.bid_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {bids.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">No bids yet</p>
                  ) : bids.map(bid => (
                    <div key={bid.bid_id} className={`flex items-center justify-between p-2 rounded-lg text-sm ${bid.status === 'winning' ? 'bg-green-50' : 'bg-slate-50'}`}>
                      <span className="text-slate-700">{bid.bidder_name}</span>
                      <span className="font-medium text-slate-900">${bid.bid_amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {event.status === 'finalized' && event.final_allocation && (
                  <div className="p-2.5 rounded-lg bg-slate-50 text-sm text-slate-600 mt-3">{event.final_allocation}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

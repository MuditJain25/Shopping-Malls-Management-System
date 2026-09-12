import { useState } from 'react';
import { Lock } from 'lucide-react';
import { PageHeader, Badge } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import {
  bidEvents, getBidEventsByMall, getBidsByEvent, getWinningBid, getStoreById
} from '@/lib/mockData.js';

export default function BiddingView({ mallId }) {
  const [refresh, setRefresh] = useState(0);
  const [finalizeEvent, setFinalizeEvent] = useState(null);
  const [allocation, setAllocation] = useState('');

  const events = getBidEventsByMall(mallId);

  const handleFinalize = async () => {
    const event = bidEvents.find(be => be.event_id === finalizeEvent.event_id);
    if (event) {
      event.status = 'finalized';
      event.final_allocation = allocation;
    }
    setFinalizeEvent(null);
    setAllocation('');
    setRefresh(r => r + 1);
  };

  return (
    <div key={refresh}>
      <PageHeader title="Bidding Control" subtitle="Open, close, and manage bidding events for mall properties" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map(event => {
          const store = getStoreById(event.store_id);
          const eventBids = getBidsByEvent(event.event_id);
          const winning = getWinningBid(event.event_id);
          return (
            <div key={event.event_id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{store?.store_name}</h3>
                  <p className="text-xs text-slate-400">Shop {store?.shop_number} · {store?.area_sqft} sqft</p>
                </div>
                <Badge variant={event.status === 'open' ? 'success' : event.status === 'finalized' ? 'neutral' : 'warning'}>{event.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Min Bid</p>
                  <p className="font-semibold text-slate-800 text-sm">${event.minimum_bid_amount.toLocaleString()}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Min Increment</p>
                  <p className="font-semibold text-slate-800 text-sm">${event.minimum_bid_increment.toLocaleString()}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Total Bids</p>
                  <p className="font-semibold text-slate-800 text-sm">{eventBids.length}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Highest Bid</p>
                  <p className="font-semibold text-green-600 text-sm">${(winning?.bid_amount || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
                {eventBids.map(bid => (
                  <div key={bid.bid_id} className={`flex items-center justify-between p-2 rounded-lg text-sm ${bid.status === 'winning' ? 'bg-green-50' : 'bg-slate-50'}`}>
                    <span className="text-slate-700">{bid.bidder_name}</span>
                    <span className="font-medium text-slate-900">${bid.bid_amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {event.status === 'open' && (
                <button onClick={() => setFinalizeEvent(event)} className="btn-secondary w-full text-sm">
                  <Lock size={14} /> Close & Finalize
                </button>
              )}
              {event.status === 'finalized' && event.final_allocation && (
                <div className="p-2.5 rounded-lg bg-slate-50 text-sm text-slate-600">
                  {event.final_allocation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={!!finalizeEvent} onClose={() => setFinalizeEvent(null)} title="Finalize Bid Event" size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Close the bidding event for <span className="font-medium text-slate-800">{finalizeEvent && getStoreById(finalizeEvent.store_id)?.store_name}</span> and record the winning allocation.
          </p>
          {finalizeEvent && getWinningBid(finalizeEvent.event_id) && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-slate-600">Winning Bid</p>
              <p className="font-bold text-slate-900">{getWinningBid(finalizeEvent.event_id).bidder_name} — ${getWinningBid(finalizeEvent.event_id).bid_amount.toLocaleString()}</p>
            </div>
          )}
          <div>
            <label className="label">Final Allocation Note</label>
            <input className="input" value={allocation} onChange={e => setAllocation(e.target.value)} placeholder="e.g. Awarded to Taylor Quinn" />
          </div>
          <button onClick={handleFinalize} className="btn-primary w-full">Finalize Event</button>
        </div>
      </Modal>
    </div>
  );
}

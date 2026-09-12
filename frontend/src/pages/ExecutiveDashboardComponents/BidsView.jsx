import { useState } from 'react';
import { Trophy, Lock } from 'lucide-react';
import { PageHeader, Badge } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import {
  bidEvents, getBidsByEvent, getWinningBid, getStoreById, getMallById,
} from '@/lib/mockData.js';

export default function BidsView() {
  const [refresh, setRefresh] = useState(0);
  const [finalizeEvent, setFinalizeEvent] = useState(null);
  const [allocation, setAllocation] = useState('');

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
      <PageHeader title="Bid Events Overview" subtitle="All active and past bidding events across malls" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bidEvents.map(event => {
          const store = getStoreById(event.store_id);
          const mall = store ? getMallById(store.mall_id) : null;
          const eventBids = getBidsByEvent(event.event_id);
          const winning = getWinningBid(event.event_id);
          return (
            <div key={event.event_id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{store?.store_name}</h3>
                  <p className="text-xs text-slate-400">{mall?.city}, {mall?.state} · {event.start_date} → {event.end_date}</p>
                </div>
                <Badge variant={event.status === 'open' ? 'success' : 'neutral'}>{event.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Total Bids</p>
                  <p className="font-semibold text-slate-800 text-sm">{eventBids.length}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Highest Bid</p>
                  <p className="font-semibold text-green-600 text-sm">${(winning?.bid_amount || 0).toLocaleString()}</p>
                </div>
              </div>
              {winning && (
                <div className="p-2.5 rounded-lg bg-green-50 mb-3 flex items-center gap-2">
                  <Trophy size={14} className="text-green-600" />
                  <span className="text-sm text-slate-700">Leading: <span className="font-medium">{winning.bidder_name}</span> — ${winning.bid_amount.toLocaleString()}</span>
                </div>
              )}
              {event.status === 'open' && (
                <button onClick={() => setFinalizeEvent(event)} className="btn-secondary w-full text-sm">
                  <Lock size={14} /> Approve & Finalize
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
            Finalize bidding for <span className="font-medium text-slate-800">{finalizeEvent && getStoreById(finalizeEvent.store_id)?.store_name}</span>
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

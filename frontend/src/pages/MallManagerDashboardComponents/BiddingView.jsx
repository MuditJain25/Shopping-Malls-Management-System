import { useState, useEffect } from 'react';
import { Lock, Plus } from 'lucide-react';
import { PageHeader, Badge, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { apiGetBidEventsByMall, apiGetBidsByEvent, apiGetStoresByMall, apiFinalizeBidEvent, apiCreateBidEvent } from '@/lib/api.js';

const EMPTY_EVENT = { store_id: '', start_date: '', end_date: '', minimum_bid_amount: '', minimum_bid_increment: '' };

export default function BiddingView({ mallId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [finalizeEvent, setFinalizeEvent] = useState(null);
  const [allocation, setAllocation] = useState('');
  const [actionError, setActionError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newEvent, setNewEvent] = useState(EMPTY_EVENT);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const [events, stores] = await Promise.all([
          apiGetBidEventsByMall(mallId),
          apiGetStoresByMall(mallId),
        ]);
        const bidsList = await Promise.all(events.map(ev => apiGetBidsByEvent(ev.event_id)));
        if (cancelled) return;
        const bidsByEvent = {};
        events.forEach((ev, i) => { bidsByEvent[ev.event_id] = bidsList[i]; });
        setData({ events, stores, bidsByEvent });
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [mallId, refresh]);

  const handleFinalize = async () => {
    setActionError(null);
    try {
      await apiFinalizeBidEvent(finalizeEvent.event_id, allocation);
      setFinalizeEvent(null);
      setAllocation('');
      setRefresh(r => r + 1);
    } catch (e) {
      setActionError(e.message);
    }
  };

  const handleCreate = async () => {
    setActionError(null);
    try {
      if (!newEvent.store_id) throw new Error('Choose a store for the bidding event');
      if (!newEvent.start_date || !newEvent.end_date) throw new Error('Start and end dates are required');
      await apiCreateBidEvent({
        store_id: Number(newEvent.store_id),
        start_date: newEvent.start_date,
        end_date: newEvent.end_date,
        minimum_bid_amount: Number(newEvent.minimum_bid_amount) || 0,
        minimum_bid_increment: Number(newEvent.minimum_bid_increment) || 0,
      });
      setShowCreate(false);
      setNewEvent(EMPTY_EVENT);
      setRefresh(r => r + 1);
    } catch (e) {
      setActionError(e.message);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingSpinner label="Loading bidding events..." />;

  const { events, stores, bidsByEvent } = data;
  const storeById = (id) => stores.find(s => s.store_id === id);

  return (
    <div>
      <PageHeader
        title="Bidding Control"
        subtitle="Open, close, and manage bidding events for mall properties"
        action={<button onClick={() => setShowCreate(true)} className="btn-primary text-sm"><Plus size={16} /> Create Bid Event</button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map(event => {
          const store = storeById(event.store_id);
          const eventBids = bidsByEvent[event.event_id] || [];
          const winning = event.winningBid;
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
              {event.status === 'finalized' && (
                <div className="p-2.5 rounded-lg bg-slate-50 text-sm text-slate-600">
                  {winning ? `Awarded to ${winning.bidder_name}` : 'Finalized'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={!!finalizeEvent} onClose={() => setFinalizeEvent(null)} title="Finalize Bid Event" size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Close the bidding event for <span className="font-medium text-slate-800">{finalizeEvent && storeById(finalizeEvent.store_id)?.store_name}</span> and record the winning allocation.
          </p>
          {finalizeEvent?.winningBid && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-slate-600">Winning Bid</p>
              <p className="font-bold text-slate-900">{finalizeEvent.winningBid.bidder_name} — ${finalizeEvent.winningBid.bid_amount.toLocaleString()}</p>
            </div>
          )}
          <div>
            <label className="label">Final Allocation Note</label>
            <input className="input" value={allocation} onChange={e => setAllocation(e.target.value)} placeholder="e.g. Awarded to Taylor Quinn" />
          </div>
          {actionError && <ErrorState message={actionError} />}
          <button onClick={handleFinalize} className="btn-primary w-full">Finalize Event</button>
        </div>
      </Modal>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Bid Event" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Store</label>
            <select className="input" value={newEvent.store_id} onChange={e => setNewEvent({ ...newEvent, store_id: e.target.value })}>
              <option value="">Select a store…</option>
              {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.store_name} · Shop {s.shop_number}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start Date</label><input type="date" className="input" value={newEvent.start_date} onChange={e => setNewEvent({ ...newEvent, start_date: e.target.value })} /></div>
            <div><label className="label">End Date</label><input type="date" className="input" value={newEvent.end_date} onChange={e => setNewEvent({ ...newEvent, end_date: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Min Bid ($)</label><input type="number" className="input" value={newEvent.minimum_bid_amount} onChange={e => setNewEvent({ ...newEvent, minimum_bid_amount: e.target.value })} /></div>
            <div><label className="label">Min Increment ($)</label><input type="number" className="input" value={newEvent.minimum_bid_increment} onChange={e => setNewEvent({ ...newEvent, minimum_bid_increment: e.target.value })} /></div>
          </div>
          {actionError && <ErrorState message={actionError} />}
          <button onClick={handleCreate} className="btn-primary w-full">Create Bid Event</button>
        </div>
      </Modal>
    </div>
  );
}

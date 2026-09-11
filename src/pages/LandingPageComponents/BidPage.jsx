import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, MapPin, TrendingUp, AlertCircle, Check } from 'lucide-react';

import { Badge, ErrorState, EmptyState } from '@/components/ui/index.jsx'
import { getBidsByEvent,  getMallById} from '@/lib/mockData.js';
import { apiPlaceBid } from '@/lib/api.js';


export default function BidPage({ event, property, user, onBack, onSignIn }) {
  const mall = getMallById(property.mall_id);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBids = useCallback(async () => {
    const data = getBidsByEvent(event.event_id);
    setBids(data);
    setLoading(false);
  }, [event.event_id]);

  useEffect(() => {
    fetchBids();
    const interval = setInterval(fetchBids, 5000);
    return () => clearInterval(interval);
  }, [fetchBids]);

  const winningBid = bids.find(b => b.status === 'winning');
  const currentHighest = winningBid?.bid_amount || event.minimum_bid_amount;
  const minNextBid = currentHighest + event.minimum_bid_increment;

  const handlePlaceBid = async () => {
    if (!user) { onSignIn(); return; }
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minNextBid) {
      setError(`Minimum next bid is $${minNextBid.toLocaleString()}`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await apiPlaceBid(event.event_id, user.id, amount, `${user.firstName} ${user.lastName}`);
      await fetchBids();
      setSuccess(`Bid of $${amount.toLocaleString()} placed successfully!`);
      setBidAmount('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronRight size={14} className="rotate-180" /> Back to properties
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="card overflow-hidden mb-3">
            <img src={property.listing_media[0]} alt={property.store_name} className="w-full h-48 object-cover" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-1">{property.store_name}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <MapPin size={14} /> {mall?.city}, {mall?.state} · Floor {property.floor} · {property.area_sqft} sqft
          </div>
          <div className="card p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Minimum Bid</span>
              <span className="font-medium text-slate-800">${event.minimum_bid_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Min Increment</span>
              <span className="font-medium text-slate-800">${event.minimum_bid_increment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">End Date</span>
              <span className="font-medium text-slate-800">{event.end_date}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="card p-5 mb-3 bg-brand-600 text-white">
            <p className="text-sm text-brand-100 mb-1">Current Highest Bid</p>
            <p className="text-3xl font-bold mb-1">${currentHighest.toLocaleString()}</p>
            <div className="flex items-center gap-2 text-sm text-brand-100">
              <TrendingUp size={12} />
              {winningBid ? `Leading: ${winningBid.bidder_name}` : 'No bids yet'}
            </div>
          </div>

          <div className="card p-4 mb-3">
            {!user ? (
              <div className="text-center py-3">
                <AlertCircle size={20} className="text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-3">Sign in to place a bid</p>
                <button onClick={onSignIn} className="btn-primary text-sm">Sign In</button>
              </div>
            ) : (
              <>
                <label className="label">Your Bid (min ${minNextBid.toLocaleString()})</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    placeholder={minNextBid.toString()}
                    className="input flex-1"
                  />
                  <button onClick={handlePlaceBid} disabled={submitting} className="btn-primary shrink-0">
                    {submitting ? '...' : 'Place Bid'}
                  </button>
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                {success && <p className="mt-2 text-sm text-green-600 flex items-center gap-1"><Check size={12} /> {success}</p>}
              </>
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Bid History</h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-10 w-full" />)}
              </div>
            ) : bids.length === 0 ? (
              <EmptyState title="No bids yet" message="Be the first to bid." />
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {[...bids].reverse().map(bid => (
                  <div key={bid.bid_id} className={`flex items-center justify-between p-2.5 rounded-lg ${bid.status === 'winning' ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{bid.bidder_name}</p>
                      <p className="text-xs text-slate-400">Round {bid.round_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 text-sm">${bid.bid_amount.toLocaleString()}</p>
                      {bid.status === 'winning' && <span className="text-xs text-green-600">Winning</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
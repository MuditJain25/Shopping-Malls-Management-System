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

export default function Discover({ user }) {
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
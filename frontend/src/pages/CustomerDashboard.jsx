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
import { apiPlaceBid } from '@/lib/api.js';
import Discover  from './CustomerPageComponents/Discover';
import MyBids from './CustomerPageComponents/MyBid';
import Properties from './CustomerPageComponents/Properties';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { route } = useRouter();
  if (!user) return <LoadingSpinner />;
  const pageKey = route.split('/').pop() || 'customer';

  if (pageKey === 'customer') return <Discover user={user} />;
  if (pageKey === 'properties') return <Properties user={user} />;
  if (pageKey === 'bids') return <MyBids user={user} />;
  return <Discover user={user} />;
}

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, MapPin, Search, Star, ArrowRight, Building2,
  Tag, Gavel, TrendingUp, Phone, ChevronRight, Check, AlertCircle, Store
} from 'lucide-react';
import { useRouter } from '@/context/RouterContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import {
  malls, getStoresByMall, getTopSellingProducts, getAvailableStores,
  getBidEventsByMall, getBidsByEvent, getWinningBid, bidEvents, stores,
  getMallById, getStoreById
} from '@/lib/mockData.js';
import { apiPlaceBid } from '@/lib/api.js';
import Modal from '@/components/ui/Modal.jsx';
import { Badge, ErrorState, EmptyState } from '@/components/ui/index.jsx';

const CATEGORIES = ['Fashion', 'Electronics', 'Home & Decor', 'Beauty'];

export default function LandingPage() {
  const [view, setView] = useState('home');
  const [selectedMall, setSelectedMall] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [bidEvent, setBidEvent] = useState(null);
  const { navigate } = useRouter();
  const { user } = useAuth();

  const handleSelectMall = (mall) => {
    setSelectedMall(mall);
    setView('mall-detail');
  };

  const filteredMalls = malls.filter(m =>
    !searchQuery ||
    m.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mallStores = selectedMall ? getStoresByMall(selectedMall.mall_id).filter(s => s.status === 'occupied') : [];
  const topProducts = selectedMall ? getTopSellingProducts(selectedMall.mall_id) : [];
  const categoryProducts = selectedCategory
    ? topProducts.filter(p => p.category === selectedCategory)
    : topProducts;

  const allAvailableStores = stores.filter(s => s.status === 'available');

  const handleExploreProperties = () => {
    setView('properties');
  };

  const handleOpenBid = (property) => {
    const event = bidEvents.find(be => be.store_id === property.store_id && be.status === 'open');
    if (event) {
      setBidEvent(event);
      setSelectedProperty(property);
      setView('bid');
    } else {
      setSelectedProperty(property);
      setView('property-detail');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <span className="font-bold text-base text-slate-900">MallHub</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <button onClick={() => { setView('home'); setSelectedMall(null); }} className="px-3 py-1.5 text-sm text-slate-600 hover:text-brand-600">Discover</button>
            <button onClick={handleExploreProperties} className="px-3 py-1.5 text-sm text-slate-600 hover:text-brand-600">Properties</button>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <button onClick={() => navigate('/app/' + user.role.replace('_', '-'))} className="btn-primary text-sm">
                Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/signin')} className="btn-ghost text-sm">Sign In</button>
                <button onClick={() => navigate('/signup')} className="btn-primary text-sm">Sign Up</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {view === 'home' && (
        <>
          <section className="bg-brand-700 text-white">
            <div className="max-w-6xl mx-auto px-4 py-16">
              <h1 className="text-3xl font-bold mb-3">Find your next shopping destination</h1>
              <p className="text-brand-100 text-base mb-6 max-w-xl">
                Browse top malls, explore brands and products, discover available retail spaces, and bid on properties.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by city or mall name..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                  />
                </div>
                <button onClick={handleExploreProperties} className="btn bg-white text-brand-700 hover:bg-brand-50 px-5 py-2.5 rounded-lg font-semibold text-sm">
                  Explore Properties
                </button>
              </div>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 py-10">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Malls Near You</h2>
            <p className="text-sm text-slate-500 mb-6">Discover shopping centers in your area</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMalls.map(mall => (
                <button
                  key={mall.mall_id}
                  onClick={() => handleSelectMall(mall)}
                  className="card overflow-hidden text-left hover:shadow-md transition-shadow"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img src={mall.imageUrl} alt={mall.city} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-3 text-white text-sm flex items-center gap-1">
                      <MapPin size={12} /> {mall.city}, {mall.state}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-1 text-sm">{mall.city === 'New York' ? 'Heritage Plaza' : mall.city === 'San Jose' ? 'Tech Park Mall' : 'Lakeshore Mall'}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{mall.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Building2 size={12} /> {getStoresByMall(mall.mall_id).length} stores</span>
                      <span className="flex items-center gap-1"><Tag size={12} /> {getTopSellingProducts(mall.mall_id).length} products</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white border-t border-slate-200">
            <div className="max-w-6xl mx-auto px-4 py-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Building2, title: 'Explore Properties', text: 'Browse available retail spaces for lease.' },
                  { icon: Gavel, title: 'Join Bidding Events', text: 'Participate in property bidding with live updates.' },
                  { icon: TrendingUp, title: 'Top Products', text: 'Discover top-selling products across malls.' },
                ].map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="text-center">
                      <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center mx-auto mb-3">
                        <Icon size={22} className="text-brand-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1 text-sm">{f.title}</h3>
                      <p className="text-xs text-slate-500">{f.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <footer className="bg-slate-800 text-slate-400 py-6">
            <div className="max-w-6xl mx-auto px-4 text-center text-xs">
              <p>MallHub — Mall Management Platform. Built with React & Spring Boot.</p>
            </div>
          </footer>
        </>
      )}

      {view === 'mall-detail' && selectedMall && (
        <MallDetail
          mall={selectedMall}
          stores={mallStores}
          topProducts={topProducts}
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categoryProducts={categoryProducts}
          onBack={() => { setView('home'); setSelectedMall(null); }}
          onExploreProperties={handleExploreProperties}
        />
      )}

      {view === 'properties' && (
        <PropertiesList
          stores={allAvailableStores}
          onBack={() => setView('home')}
          onOpenBid={handleOpenBid}
          user={user}
          onSignIn={() => navigate('/signin')}
        />
      )}

      {view === 'property-detail' && selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          onBack={() => setView('properties')}
        />
      )}

      {view === 'bid' && bidEvent && selectedProperty && (
        <BidPage
          event={bidEvent}
          property={selectedProperty}
          user={user}
          onBack={() => setView('properties')}
          onSignIn={() => navigate('/signin')}
        />
      )}
    </div>
  );
}

function MallDetail({ mall, stores, topProducts, categories, selectedCategory, setSelectedCategory, categoryProducts, onBack, onExploreProperties }) {
  const availableCount = getAvailableStores(mall.mall_id).length;
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronRight size={14} className="rotate-180" /> Back to malls
      </button>

      <div className="relative h-48 rounded-lg overflow-hidden mb-6">
        <img src={mall.imageUrl} alt={mall.city} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h1 className="font-bold text-2xl mb-1">
            {mall.city === 'New York' ? 'Heritage Plaza' : mall.city === 'San Jose' ? 'Tech Park Mall' : 'Lakeshore Mall'}
          </h1>
          <div className="flex items-center gap-3 text-sm text-slate-200">
            <span className="flex items-center gap-1"><MapPin size={12} /> {mall.street}, {mall.city}, {mall.state}</span>
            <span className="flex items-center gap-1"><Building2 size={12} /> {(mall.mall_area_sqft / 100000).toFixed(1)}M sqft</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{stores.length}</p>
          <p className="text-xs text-slate-500">Active Stores</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{topProducts.length}</p>
          <p className="text-xs text-slate-500">Top Products</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{availableCount}</p>
          <p className="text-xs text-slate-500">Available</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{mall.contact_numbers.length}</p>
          <p className="text-xs text-slate-500">Contact Lines</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-base font-bold text-slate-900 mb-3">Top Brands</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {stores.map(store => (
            <div key={store.store_id} className="card overflow-hidden flex items-center gap-3 p-2">
              <img src={store.listing_media[0]} alt={store.store_name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">{store.store_name}</p>
                <p className="text-xs text-slate-400">Floor {store.floor} · Shop {store.shop_number}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-base font-bold text-slate-900 mb-3">Explore Categories</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-sm ${!selectedCategory ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm ${selectedCategory === cat ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryProducts.length === 0 ? (
            <div className="col-span-full"><EmptyState title="No products found" message="No top-selling products in this category." /></div>
          ) : categoryProducts.map(product => (
            <div key={product.product_id} className="card overflow-hidden">
              <div className="relative h-32 overflow-hidden bg-slate-100">
                <img src={product.imageUrl} alt={product.product_name} className="w-full h-full object-cover" />
                <span className="absolute top-1.5 right-1.5 badge bg-amber-400 text-white">Top</span>
              </div>
              <div className="p-3">
                <p className="text-xs text-slate-400">{product.category}</p>
                <h3 className="font-medium text-slate-800 text-sm mb-1 line-clamp-1">{product.product_name}</h3>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-brand-600 text-sm">${product.price.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{product.store?.store_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {availableCount > 0 && (
        <div className="card p-4 bg-brand-50 border-brand-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Available Retail Spaces</h3>
              <p className="text-xs text-slate-500">{availableCount} properties available for lease</p>
            </div>
            <button onClick={onExploreProperties} className="btn-primary text-sm">
              Explore Properties
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PropertiesList({ stores, onBack, onOpenBid, user, onSignIn }) {
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

function PropertyDetail({ property, onBack }) {
  const mall = getMallById(property.mall_id);
  const [activeMedia, setActiveMedia] = useState(0);
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronRight size={14} className="rotate-180" /> Back to properties
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="card overflow-hidden mb-2">
            <img src={property.listing_media[activeMedia]} alt={property.store_name} className="w-full h-56 object-cover" />
          </div>
          <div className="flex gap-2">
            {property.listing_media.map((media, i) => (
              <button
                key={i}
                onClick={() => setActiveMedia(i)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${activeMedia === i ? 'border-brand-500' : 'border-transparent'}`}
              >
                <img src={media} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">{property.store_name}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <MapPin size={14} /> {mall?.street}, {mall?.city}, {mall?.state} {mall?.pincode}
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-sm text-slate-500">Shop Number</span>
              <span className="text-sm font-medium text-slate-800">{property.shop_number}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-sm text-slate-500">Floor</span>
              <span className="text-sm font-medium text-slate-800">Floor {property.floor}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-sm text-slate-500">Area</span>
              <span className="text-sm font-medium text-slate-800">{property.area_sqft} sqft</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-sm text-slate-500">Status</span>
              <Badge variant="success">Available</Badge>
            </div>
          </div>
          <div className="card p-3 bg-brand-50 border-brand-200">
            <p className="text-sm text-slate-600">
              No active bidding event for this property yet. Check back later or contact the mall directly.
            </p>
            {mall?.contact_numbers?.map(num => (
              <div key={num} className="flex items-center gap-2 text-sm text-slate-700 mt-2">
                <Phone size={12} /> {num}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BidPage({ event, property, user, onBack, onSignIn }) {
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

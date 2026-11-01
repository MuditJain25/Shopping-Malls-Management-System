import { useState, useEffect } from "react";
import {
  ShoppingBag,
  MapPin,
  Search,
  Building2,
  Tag,
  Gavel,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "@/context/RouterContext.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import {
  apiGetMalls,
  apiGetNearestMalls,
  apiGetStoresByMall,
  apiGetTopSellingProducts,
  apiGetAvailableStores,
  apiGetBidEvents,
} from "@/lib/api.js";
import { ErrorState, EmptyState, LoadingSpinner } from "@/components/ui/index.jsx";
import BidPage from "./LandingPageComponents/BidPage.jsx";
import MallDetail from "./LandingPageComponents/MallDetail.jsx";
import PropertiesList from "./LandingPageComponents/PropertiesList.jsx";
import PropertyDetail from "./LandingPageComponents/PropertyDetail.jsx";

export default function LandingPage() {
  const [view, setView] = useState("home");
  const [selectedMall, setSelectedMall] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [bidEvent, setBidEvent] = useState(null);
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [nearby, setNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState("");

  // Malls shown in the home grid.
  const [malls, setMalls] = useState([]);
  const [storeCountByMall, setStoreCountByMall] = useState({});
  const [productCountByMall, setProductCountByMall] = useState({});
  const [mallsLoading, setMallsLoading] = useState(true);
  const [mallsError, setMallsError] = useState("");

  // Detail of the mall the user opened.
  const [mallStores, setMallStores] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Available properties, with the mall and open bid event each one belongs to.
  const [availableStores, setAvailableStores] = useState([]);
  const [mallById, setMallById] = useState({});
  const [eventByStore, setEventByStore] = useState({});
  const [propsLoading, setPropsLoading] = useState(false);
  const [propsError, setPropsError] = useState("");

  const selectedMallId = selectedMall?.mall_id;
  const categories = Array.from(
    new Set(topProducts.map((p) => p.category).filter(Boolean)),
  );
  const categoryProducts = selectedCategory
    ? topProducts.filter((p) => p.category === selectedCategory)
    : topProducts;

  // The mall grid is filtered by the database, not in the browser. The card counters
  // come from the same existing per-mall endpoints the detail view already uses.
  useEffect(() => {
    const q = searchQuery.trim();
    setNearby(false);
    let cancelled = false;
    (async () => {
      try {
        setMallsLoading(true);
        setMallsError("");
        const list = await apiGetMalls(q ? { q } : {});
        if (cancelled) return;
        setMalls(list);
        const [storesPerMall, productsPerMall] = await Promise.all([
          Promise.all(
            list.map((m) => apiGetStoresByMall(m.mall_id).catch(() => [])),
          ),
          Promise.all(
            list.map((m) =>
              apiGetTopSellingProducts(m.mall_id).catch(() => []),
            ),
          ),
        ]);
        if (cancelled) return;
        const storeCounts = {};
        const productCounts = {};
        list.forEach((m, i) => {
          storeCounts[m.mall_id] = storesPerMall[i].length;
          productCounts[m.mall_id] = productsPerMall[i].length;
        });
        setStoreCountByMall(storeCounts);
        setProductCountByMall(productCounts);
      } catch (err) {
        if (!cancelled) setMallsError(err.message || "Failed to load malls");
      } finally {
        if (!cancelled) setMallsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  // Stores, top products and availability of the opened mall.
  useEffect(() => {
    if (selectedMallId == null) return;
    let cancelled = false;
    (async () => {
      try {
        setDetailLoading(true);
        setDetailError("");
        const [stores, products, available] = await Promise.all([
          apiGetStoresByMall(selectedMallId),
          apiGetTopSellingProducts(selectedMallId),
          apiGetAvailableStores(selectedMallId),
        ]);
        if (cancelled) return;
        setMallStores(stores.filter((s) => s.status === "occupied"));
        setTopProducts(products);
        setAvailableCount(available.length);
      } catch (err) {
        if (!cancelled) setDetailError(err.message || "Failed to load mall");
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedMallId]);

  // The properties view needs every available store plus its mall and open event.
  useEffect(() => {
    if (view !== "properties") return;
    let cancelled = false;
    (async () => {
      try {
        setPropsLoading(true);
        setPropsError("");
        const [stores, mallList, openEvents] = await Promise.all([
          apiGetAvailableStores(),
          apiGetMalls(),
          apiGetBidEvents("open"),
        ]);
        if (cancelled) return;
        setAvailableStores(stores);
        const mallsById = {};
        mallList.forEach((m) => {
          mallsById[m.mall_id] = m;
        });
        setMallById(mallsById);
        const eventsByStore = {};
        openEvents.forEach((e) => {
          eventsByStore[e.store_id] = e;
        });
        setEventByStore(eventsByStore);
      } catch (err) {
        if (!cancelled) setPropsError(err.message || "Failed to load properties");
      } finally {
        if (!cancelled) setPropsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view]);

  const handleSelectMall = (mall) => {
    setSelectedMall(mall);
    setSelectedCategory(null);
    setView("mall-detail");
  };

  const handleExploreProperties = () => {
    setView("properties");
  };

  const handleSearchRequest = (event) => {
    event.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleOpenBid = (property) => {
    const event = eventByStore[property.store_id];
    if (event) {
      setBidEvent(event);
      setSelectedProperty(property);
      setView("bid");
    } else {
      setSelectedProperty(property);
      setView("property-detail");
    }
  };

  // Nearest-first ordering comes from the backend (/api/malls/nearest); the grid
  // reuses the existing loading/error state, so only the rows swap.
  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      setNearbyError("Geolocation is not supported by this browser.");
      return;
    }
    setNearbyError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          setMallsLoading(true);
          setMallsError("");
          const list = await apiGetNearestMalls(
            coords.latitude,
            coords.longitude,
            6,
          );
          setMalls(list);
          setNearby(true);
        } catch (err) {
          setMallsError(err.message || "Failed to load nearby malls");
        } finally {
          setMallsLoading(false);
        }
      },
      () =>
        setNearbyError(
          "Unable to retrieve your location. Allow location access and try again.",
        ),
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <span className="font-bold text-base text-slate-900">
              Shopping Malls Management System
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => {
                setView("home");
                setSelectedMall(null);
              }}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-brand-600"
            >
              Discover
            </button>
            <button
              onClick={handleExploreProperties}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-brand-600"
            >
              Properties
            </button>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={() => navigate("/app/" + user.role.replace("_", "-"))}
                className="btn-primary text-sm"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/signin")}
                  className="btn-primary text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="btn-primary text-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {view === "home" && (
        <>
          <section className="bg-brand-700 text-white">
            <div className="max-w-6xl mx-auto px-4 py-16">
              <h1 className="text-3xl font-bold mb-3">
                Find your next shopping destination
              </h1>
              <p className="text-brand-100 text-base mb-6 max-w-xl">
                Browse top malls, explore brands and products, discover
                available retail spaces.
              </p>
              <form
                onSubmit={handleSearchRequest}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by city or state..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="btn bg-white text-brand-700 hover:bg-brand-50 px-5 py-2.5 rounded-lg font-semibold text-sm"
                >
                  Search
                </button>
                <button
                  onClick={handleFindNearby}
                  className="btn bg-white text-brand-700 hover:bg-brand-50 px-5 py-2.5 rounded-lg font-semibold text-sm"
                >
                  Find nearby malls
                </button>
              </form>
              {nearbyError && (
                <p className="text-sm text-amber-200 mt-3">{nearbyError}</p>
              )}
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 py-10">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {nearby ? "Nearest malls" : "Malls Near You"}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Discover shopping centers in your area
            </p>
            {mallsLoading ? (
              <LoadingSpinner label="Loading malls..." />
            ) : mallsError ? (
              <ErrorState message={mallsError} />
            ) : malls.length === 0 ? (
              <EmptyState
                title="No malls found"
                message="No shopping center matches your search."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {malls.map((mall) => (
                  <button
                    key={mall.mall_id}
                    onClick={() => handleSelectMall(mall)}
                    className="card overflow-hidden text-left hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={mall.imageUrl}
                        alt={mall.city}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-3 text-white text-sm flex items-center gap-1">
                        <MapPin size={12} /> {mall.city}, {mall.state}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-1 text-sm">
                        {mall.mall_name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                        {mall.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Building2 size={12} />{" "}
                          {storeCountByMall[mall.mall_id] ?? 0} stores
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag size={12} />{" "}
                          {productCountByMall[mall.mall_id] ?? 0} products
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border-t border-slate-200">
            <div className="max-w-6xl mx-auto px-4 py-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: Building2,
                    title: "Explore Properties",
                    text: "Browse available retail spaces for lease.",
                  },
                  {
                    icon: Gavel,
                    title: "Join Bidding Events",
                    text: "Participate in property bidding with live updates.",
                  },
                  {
                    icon: TrendingUp,
                    title: "Top Products",
                    text: "Discover top-selling products across malls.",
                  },
                ].map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="text-center">
                      <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center mx-auto mb-3">
                        <Icon size={22} className="text-brand-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1 text-sm">
                        {f.title}
                      </h3>
                      <p className="text-xs text-slate-500">{f.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <footer className="bg-slate-800 text-slate-400 py-6">
            <div className="max-w-6xl mx-auto px-4 text-center text-xs">
              <p> Mall Management Platform.</p>
            </div>
          </footer>
        </>
      )}

      {view === "mall-detail" && selectedMall && (
        <>
          {detailLoading ? (
            <LoadingSpinner label="Loading mall..." />
          ) : detailError ? (
            <div className="max-w-6xl mx-auto px-4 py-6">
              <ErrorState message={detailError} />
            </div>
          ) : (
            <MallDetail
              mall={selectedMall}
              stores={mallStores}
              topProducts={topProducts}
              availableCount={availableCount}
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categoryProducts={categoryProducts}
              onBack={() => {
                setView("home");
                setSelectedMall(null);
              }}
              onExploreProperties={handleExploreProperties}
            />
          )}
        </>
      )}

      {view === "properties" && (
        <>
          {propsLoading ? (
            <LoadingSpinner label="Loading properties..." />
          ) : propsError ? (
            <div className="max-w-6xl mx-auto px-4 py-6">
              <ErrorState message={propsError} />
            </div>
          ) : (
            <PropertiesList
              stores={availableStores}
              mallById={mallById}
              eventByStore={eventByStore}
              onBack={() => setView("home")}
              onOpenBid={handleOpenBid}
              user={user}
              onSignIn={() => navigate("/signin")}
            />
          )}
        </>
      )}

      {view === "property-detail" && selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          mall={mallById[selectedProperty.mall_id]}
          onBack={() => setView("properties")}
        />
      )}

      {view === "bid" && bidEvent && selectedProperty && (
        <BidPage
          event={bidEvent}
          property={selectedProperty}
          mall={mallById[selectedProperty.mall_id]}
          user={user}
          onBack={() => setView("properties")}
          onSignIn={() => navigate("/signin")}
        />
      )}
    </div>
  );
}

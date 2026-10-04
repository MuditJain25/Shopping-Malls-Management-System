import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  MapPin,
  Search,
  Star,
  ArrowRight,
  Building2,
  Tag,
  Gavel,
  TrendingUp,
  Phone,
  ChevronRight,
  Check,
  AlertCircle,
  Store,
} from "lucide-react";
import { useRouter } from "@/context/RouterContext.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import {
  malls,
  getStoresByMall,
  getTopSellingProducts,
  getAvailableStores,
  getBidEventsByMall,
  getBidsByEvent,
  getWinningBid,
  bidEvents,
  stores,
  getMallById,
  getStoreById,
} from "@/lib/mockData.js";
import { apiPlaceBid } from "@/lib/api.js";
import Modal from "@/components/ui/Modal.jsx";
import { Badge, ErrorState, EmptyState } from "@/components/ui/index.jsx";
import BidPage from "./LandingPageComponents/BidPage.jsx";
import MallDetail from "./LandingPageComponents/MallDetail.jsx";
import PropertiesList from "./LandingPageComponents/PropertiesList.jsx";
import PropertyDetail from "./LandingPageComponents/PropertyDetail.jsx";

const CATEGORIES = ["Fashion", "Electronics", "Home & Decor", "Beauty"];

export default function LandingPage() {
  const [view, setView] = useState("home");
  const [selectedMall, setSelectedMall] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [bidEvent, setBidEvent] = useState(null);
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [userLatitue, setUserLatitude] = useState();
  const [userLongitude, setUserLongitude] = useState();

  const handleSelectMall = (mall) => {
    setSelectedMall(mall);
    setView("mall-detail");
  };

  const searchSuggestions = searchInput
    ? malls
        .filter(
          (m) =>
            m.city.toLowerCase().includes(searchInput.toLowerCase()) ||
            m.state.toLowerCase().includes(searchInput.toLowerCase()) ||
            m.mall_name.toLowerCase().includes(searchInput.toLowerCase()),
        )
        .slice(0, 6)
    : [];

  const filteredMalls = malls.filter(
    (m) =>
      !searchQuery ||
      m.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mall_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const mallStores = selectedMall
    ? getStoresByMall(selectedMall.mall_id).filter(
        (s) => s.status === "occupied",
      )
    : [];
  const topProducts = selectedMall
    ? getTopSellingProducts(selectedMall.mall_id)
    : [];
  const categoryProducts = selectedCategory
    ? topProducts.filter((p) => p.category === selectedCategory)
    : topProducts;

  const allAvailableStores = stores.filter((s) => s.status === "available");

  const handleExploreProperties = () => {
    setView("properties");
  };

  const handleSuggestionClick = (mall) => {
    setSearchInput(mall.mall_name);
    setSearchQuery(mall.mall_name);
  };

  const handleSearchRequest = (event) => {
    event.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleOpenBid = (property) => {
    const event = bidEvents.find(
      (be) => be.store_id === property.store_id && be.status === "open",
    );
    if (event) {
      setBidEvent(event);
      setSelectedProperty(property);
      setView("bid");
    } else {
      setSelectedProperty(property);
      setView("property-detail");
    }
  };

  const geoFindMe = () => {
    function success(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      setUserLatitude(latitude);
      setUserLongitude(longitude);
    }

    function error() {
      alert("Unable to retrieve your location");
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported in your browser");
    } else {
      navigator.geolocation.getCurrentPosition(success, error);
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
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setHighlightedIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "ArrowDown" &&
                        searchSuggestions.length > 0
                      ) {
                        e.preventDefault();

                        setHighlightedIndex((prev) =>
                          prev < searchSuggestions.length - 1 ? prev + 1 : prev,
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();

                        setHighlightedIndex((prev) =>
                          prev !== -1 ? prev - 1 : prev,
                        );
                      } else if (e.key === "Enter" && highlightedIndex !== -1) {
                        e.preventDefault();

                        handleSuggestionClick(
                          searchSuggestions[highlightedIndex],
                        );

                        setHighlightedIndex(-1);
                      }
                    }}
                    placeholder="Search by city or mall name..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                  />
                  {searchInput !== searchQuery &&
                    searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg overflow-hidden z-20">
                        {searchSuggestions.map((mall, index) => (
                          <div
                            key={mall.mall_id}
                            onClick={() => handleSuggestionClick(mall)}
                            className={`px-4 py-2 cursor-pointer ${
                              highlightedIndex === index
                                ? "bg-slate-200"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <p className="text-sm font-medium text-slate-800">
                              {mall.mall_name}
                              <span className="ml-2 text-xs font-normal text-slate-400">
                                {mall.city}, {mall.state}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                <button
                  type="submit"
                  onClick={geoFindMe}
                  className="btn bg-white text-brand-700 hover:bg-brand-50 px-5 py-2.5 rounded-lg font-semibold text-sm"
                >
                  Search
                </button>
                <button
                  onClick={geoFindMe}
                  className="btn bg-white text-brand-700 hover:bg-brand-50 px-5 py-2.5 rounded-lg font-semibold text-sm"
                >
                  Find nearby malls
                </button>
                <div className="text-white">
                  {" "}
                  {userLatitue ? userLatitue : "Find latitude"}{" "}
                  {userLongitude ? userLongitude : ""}
                </div>
              </form>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 py-10">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Malls Near You
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Discover shopping centers in your area
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMalls.map((mall) => (
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
                        {getStoresByMall(mall.mall_id).length} stores
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag size={12} />{" "}
                        {getTopSellingProducts(mall.mall_id).length} products
                      </span>
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
        <MallDetail
          mall={selectedMall}
          stores={mallStores}
          topProducts={topProducts}
          categories={CATEGORIES}
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

      {view === "properties" && (
        <PropertiesList
          stores={allAvailableStores}
          onBack={() => setView("home")}
          onOpenBid={handleOpenBid}
          user={user}
          onSignIn={() => navigate("/signin")}
        />
      )}

      {view === "property-detail" && selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          onBack={() => setView("properties")}
        />
      )}

      {view === "bid" && bidEvent && selectedProperty && (
        <BidPage
          event={bidEvent}
          property={selectedProperty}
          user={user}
          onBack={() => setView("properties")}
          onSignIn={() => navigate("/signin")}
        />
      )}
    </div>
  );
}

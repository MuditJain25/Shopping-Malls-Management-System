import React, { useState } from "react";
import { ChevronRight, MapPin, Building2 } from "lucide-react";
// import { getAvailableStores } from '../../lib/api';
import { Badge, ErrorState, EmptyState } from "@/components/ui/index.jsx";
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
  storeProducts,
  getMallById,
  getStoreById,
} from "@/lib/mockData.js";

export default function MallDetail({
  mall,
  stores,
  topProducts,
  categories,
  selectedCategory,
  setSelectedCategory,
  categoryProducts,
  onBack,
  onExploreProperties,
}) {
  const [selectedStore, setSelectedStore] = useState(null);
  const displayedProducts = selectedStore
    ? categoryProducts.filter((product) =>
        storeProducts.some(
          (item) =>
            item.store_id === selectedStore &&
            item.product_id === product.product_id &&
            item.to_show,
        ),
      )
    : categoryProducts;

  const visibleCategories = selectedStore
    ? categories.filter((category) =>
        displayedProducts.some((product) => product.category === category),
      )
    : categories;

  const effectiveCategory =
    selectedStore && visibleCategories.length === 1
      ? visibleCategories[0]
      : selectedCategory;

  const showAllCategory = !selectedStore || visibleCategories.length > 1;

  const availableCount = getAvailableStores(mall.mall_id).length;

  const handleStoreSelect = (storeId) => {
    setSelectedStore(selectedStore === storeId ? null : storeId);
    setSelectedCategory(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronRight size={14} className="rotate-180" /> Back to malls
      </button>

      <div className="relative h-48 rounded-lg overflow-hidden mb-6">
        <img
          src={mall.imageUrl}
          alt={mall.city}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h1 className="font-bold text-2xl mb-1">{mall.mall_name}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-200">
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {mall.street}, {mall.city}, {mall.state}
            </span>
            <span className="flex items-center gap-1">
              <Building2 size={12} />{" "}
              {(mall.mall_area_sqft / 100000).toFixed(1)}M sqft
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{stores.length}</p>
          <p className="text-xs text-slate-500">Active Stores</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-slate-900">
            {topProducts.length}
          </p>
          <p className="text-xs text-slate-500">Top Products</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{availableCount}</p>
          <p className="text-xs text-slate-500">Available</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-slate-900">
            {mall.contact_numbers.length}
          </p>
          <p className="text-xs text-slate-500">Contact Lines</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-base font-bold text-slate-900 mb-3">Top Brands</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {stores.map((store) => (
            <div
              key={store.store_id}
              onClick={() => handleStoreSelect(store.store_id)}
              className={`card overflow-hidden flex items-center gap-3 p-2 cursor-pointer ${
                selectedStore === store.store_id ? "ring-2 ring-brand-500" : ""
              }`}
            >
              <img
                src={store.listing_media[0]}
                alt={store.store_name}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">
                  {store.store_name}
                </p>
                <p className="text-xs text-slate-400">
                  Floor {store.floor} ┬╖ Shop {store.shop_number}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-base font-bold text-slate-900 mb-3">
          Explore Categories
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {showAllCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-sm ${!selectedCategory ? "bg-brand-600 text-white" : "bg-white border border-slate-300 text-slate-600"}`}
            >
              All
            </button>
          )}
          {visibleCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm ${effectiveCategory === cat ? "bg-brand-600 text-white" : "bg-white border border-slate-300 text-slate-600"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedProducts.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="No products found"
                message="No top-selling products in this category."
              />
            </div>
          ) : (
            displayedProducts.map((product) => (
              <div key={product.product_id} className="card overflow-hidden">
                <div className="relative h-32 overflow-hidden bg-slate-100">
                  <img
                    src={product.imageUrl}
                    alt={product.product_name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 right-1.5 badge bg-amber-400 text-white">
                    Top
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs text-slate-400">{product.category}</p>
                  <h3 className="font-medium text-slate-800 text-sm mb-1 line-clamp-1">
                    {product.product_name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-brand-600 text-sm">
                      ${product.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {product.store?.store_name}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {availableCount > 0 && (
        <div className="card p-4 bg-brand-50 border-brand-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Available Retail Spaces
              </h3>
              <p className="text-xs text-slate-500">
                {availableCount} properties available for lease
              </p>
            </div>
            <button
              onClick={onExploreProperties}
              className="btn-primary text-sm"
            >
              Explore Properties
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

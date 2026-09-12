import React, { useState } from 'react';
import { ChevronRight, MapPin, Phone } from 'lucide-react';

import { Badge, ErrorState, EmptyState } from '@/components/ui/index.jsx';
import { getMallById } from '@/lib/mockData.js';

export default function PropertyDetail({ property, onBack }) {
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
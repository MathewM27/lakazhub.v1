'use client';

import Image from 'next/image';
import { Property } from '@/utils/types/property';
import { Bed, Bath, Square, Home } from 'lucide-react';
import React from 'react';

type FallbackImageComponent = React.ComponentType<{
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  [key: string]: unknown;
}>;

export interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
  fallbackImage?: FallbackImageComponent;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick, fallbackImage: FallbackImage }) => {

  return (
    <div
      className="bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg cursor-pointer group relative h-full flex flex-col transition-transform duration-200 hover:-translate-y-2"
      onClick={onClick}
    >
      {/* Availability indicator at top left (moved from right) */}
      <div className="absolute top-4 left-4 z-10">
        {property.isAvailable !== false ? (
          <div className="flex items-center gap-1.5 rounded-full bg-black/80 backdrop-blur-sm px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-white">Available</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-black/80 backdrop-blur-sm px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-xs font-medium text-white">Rented</span>
          </div>
        )}
      </div>

      {/* Property Status Tag - moved to right */}
      <div className="absolute top-4 right-4 z-10">
        <div 
          className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/20 transition-all duration-300"
        >
          {property.type || 'For Rent'}
        </div>
      </div>

      <div className="relative h-52 w-full overflow-hidden">
        {/* Use fallbackImage if provided, otherwise default to Next.js Image */}
        {FallbackImage ? (
          <FallbackImage
            src={property.imageUrl || '/bg1.jpg'}
            alt={property.name}
            className="object-cover transition-transform duration-500 group-hover:scale-110 w-full h-52"
            width={800}
            height={208}
          />
        ) : (
          <Image
            src={property.imageUrl || '/bg1.jpg'}
            alt={property.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/property-placeholder.jpg';
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/60 group-hover:to-black/80 transition-all duration-300" />
      </div>

      {/* Content Container */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div className="max-w-[60%]">
            <h3 className="text-lg font-semibold text-white group-hover:text-white/90 transition-colors truncate">
              {property.name}
            </h3>
            <p className="text-white/70 flex items-center gap-1 text-sm mt-1 truncate">
              <Home className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{property.location}</span>
            </p>
          </div>
          
          <div className="text-right flex-shrink-0">
            <div className="bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm">
              <p className="text-white font-bold whitespace-nowrap">
                Rs {(property.price || property.monthly_rent || 0).toLocaleString()}
              </p>
              <p className="text-white/60 text-xs">per month</p>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent my-3"></div>
        
        {/* Features */}
        <div className="flex justify-between mt-3 text-white/70">
          <div 
            className="flex flex-col items-center gap-1 transition-all duration-200 hover:-translate-y-1 hover:text-white"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Bed className="w-4 h-4" />
            </div>
            <span className="text-xs">{property.bedrooms} Beds</span>
          </div>
          
          <div 
            className="flex flex-col items-center gap-1 transition-all duration-200 hover:-translate-y-1 hover:text-white"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Bath className="w-4 h-4" />
            </div>
            <span className="text-xs">{property.bathrooms} Baths</span>
          </div>
          
          <div 
            className="flex flex-col items-center gap-1 transition-all duration-200 hover:-translate-y-1 hover:text-white"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Square className="w-4 h-4" />
            </div>
            <span className="text-xs">{property.area}m²</span>
          </div>
        </div>
        
        {/* View Details Button */}
        <div 
          className="mt-auto pt-4 w-full transition-all duration-300"
        >
          <button 
            className="w-full h-10 bg-transparent border border-white/20 rounded-lg text-white text-sm group-hover:bg-white group-hover:text-black transition-all duration-300"
          >
            View Details
          </button>
        </div>
      </div>
      
      {/* Animated border effect */}
      <div 
        className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-xl pointer-events-none transition-colors duration-300"
      ></div>
    </div>
  );
};
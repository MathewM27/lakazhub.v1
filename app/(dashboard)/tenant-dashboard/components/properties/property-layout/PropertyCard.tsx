'use client'

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  MapPin, Bed, Bath, ChevronLeft, ChevronRight, Home, MessageSquare 
} from "lucide-react";
import PropertyDetailModal from '../PropertyDetail';
import TenantMessage from '../message/messageProperty';

// Update Property interface to match landlord implementation but keep UI fields
export interface Property {
  id: string;
  landlord_id: string;
  name: string;
  location: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  description: string;
  monthly_rent: number;
  security_deposit: number;
  utilities: {
    water: boolean;
    electricity: boolean;
    internet: boolean;
    gas: boolean;
    trash: boolean;
    cable: boolean;
  };
  images: string[];
  image?: string; // For displaying the main image easily
  imageMetadata?: Record<string, string>;
  available: boolean;
  status?: 'active' | 'archived' | 'pending' | 'rented';
  created_at: string;
  updated_at: string;
  // Additional UI fields for tenant view
  availability?: 'Available' | 'Rented' | 'Coming Soon';
  amenities?: { name: string; icon: string }[];
  rules?: string[];
  next_available_date?: string | null;
  viewings?: { date: string; time: string }[];
}

interface PropertyCardProps {
  property: Property;
  disableInteractions?: boolean; // New prop to disable interactions for rented properties
}

interface PropertyCarouselProps {
  title: string;
  properties: Property[];
  isVisible?: boolean;
  disableInteractions?: boolean; // New prop to disable interactions for all cards in carousel
}

// Individual Property Card Component
const PropertyCard = ({ property, disableInteractions = false }: PropertyCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Make sure we have a valid image URL
  const imageUrl = property.image || 
    (property.images && property.images.length > 0 ? property.images[0] : '/placeholder-property.jpg');
  
  const handleSaveProperty = () => {
    console.log('Property saved to favorites:', property.name);
    // Here you would implement saving to user's favorites
  };

  return (
    <>
      <div 
        className={`h-full group rounded-xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-sm transition-all duration-300 ${
          disableInteractions ? 'opacity-80' : 'hover:border-white/20'
        }`}
        onMouseEnter={() => !disableInteractions && setIsHovered(true)}
        onMouseLeave={() => !disableInteractions && setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative h-48 overflow-hidden">
          {!imageError ? (
            <Image
              src={imageUrl}
              alt={property.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover ${!disableInteractions && 'transition-transform duration-700 group-hover:scale-105'}`}
              onError={() => {
                console.error(`Image failed to load: ${imageUrl}`);
                setImageError(true);
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-800">
              <Home className="h-12 w-12 text-gray-600" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 opacity-70"></div>
          
          {/* Property Name (moved from content to image overlay) */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-medium text-white border border-white/10">
            {property.name}
          </div>
          
          {/* Rented badge for disabled cards */}
          {disableInteractions && (
            <div className="absolute top-3 left-3 bg-red-900/70 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-medium text-white border border-red-400/20">
              Rented
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Monthly Rent (moved from image overlay to content) */}
          <h3 className="text-lg font-medium text-white group-hover:text-white/90 transition-colors line-clamp-1">
            Rs {property.monthly_rent.toLocaleString()}<span className="text-xs text-white/70">/mo</span>
          </h3>
          
          <div className="flex items-center mt-1 mb-3 text-white/60 text-sm">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="line-clamp-1">{property.location}</span>
          </div>
          
          <div className="h-px w-full bg-white/5 my-3"></div>
          
          {/* Property Features */}
          <div className="flex justify-between">
            <div className="flex items-center text-white/70 text-sm">
              <Bed className="w-4 h-4 mr-1.5" />
              <span>{property.bedrooms} beds</span>
            </div>
            <div className="flex items-center text-white/70 text-sm">
              <Bath className="w-4 h-4 mr-1.5" />
              <span>{property.bathrooms} baths</span>
            </div>
          </div>
          
          {/* Action Buttons - Shows on hover with simple transition unless disabled */}
          {!disableInteractions && (
            <div className={`mt-4 flex gap-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-80'}`}>
              <button 
                className="flex-1 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-1"
                onClick={() => setDetailModalOpen(true)}
              >
                View Details
              </button>
              
              <button 
                className="flex-1 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-1"
                onClick={() => setMessageModalOpen(true)}
              >
                <MessageSquare className="w-3 h-3" /> 
                Message
              </button>
            </div>
          )}

          {/* Replacement text for rented properties */}
          {disableInteractions && (
            <div className="mt-4 py-2 text-center text-white/50 text-sm border border-white/10 rounded-lg">
              Property currently occupied
            </div>
          )}
        </div>
      </div>

      {/* Only render modals if interactions are enabled */}
      {!disableInteractions && (
        <>
          <PropertyDetailModal
            property={property}
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
            onMessageLandlord={() => setMessageModalOpen(true)}
            onSaveProperty={handleSaveProperty}
          />

          <TenantMessage
            open={messageModalOpen}
            onOpenChangeAction={setMessageModalOpen}
            property={property}
          />
        </>
      )}
    </>
  );
};

// Property Carousel Component
const PropertyCarousel = ({ title, properties, isVisible = true, disableInteractions = false }: PropertyCarouselProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [isAtEnd, setIsAtEnd] = useState(false); // New state to track if we're at the end
  const [showEndIndicator, setShowEndIndicator] = useState(false); // Controls visibility of end indicator
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle scroll navigation
  const handleScroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollAmount = direction === 'left' ? -300 : 300;
    const newPosition = scrollPosition + scrollAmount;
    
    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
  };

  // Update scroll position info and check if we're at the end
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const handleScrollEvent = () => {
      const currentPos = container.scrollLeft;
      const maxScrollPos = container.scrollWidth - container.clientWidth;
      
      setScrollPosition(currentPos);
      setMaxScroll(maxScrollPos);
      
      // Check if we're at the end (within 20px of the max scroll)
      const reachedEnd = maxScrollPos > 0 && currentPos >= maxScrollPos - 20;
      setIsAtEnd(reachedEnd);
      
      // Show indicator briefly when reaching the end
      if (reachedEnd && !showEndIndicator) {
        setShowEndIndicator(true);
        // Hide it after a delay
        setTimeout(() => setShowEndIndicator(false), 2000);
      }
    };
    
    // Initial calculation
    handleScrollEvent();
    
    // Add scroll listener
    container.addEventListener('scroll', handleScrollEvent);
    window.addEventListener('resize', handleScrollEvent);
    
    return () => {
      container.removeEventListener('scroll', handleScrollEvent);
      window.removeEventListener('resize', handleScrollEvent);
    };
  }, [properties, title, showEndIndicator]);

  // Calculate progress percentage
  const progressPercentage = maxScroll > 0 ? (scrollPosition / maxScroll) * 100 : 0;

  // Don't render if there are no properties
  if (properties.length === 0) {
    return null;
  }

  return (
    // Remove transition-opacity to ensure immediate visibility
    <div className="relative">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
            <Home className="h-4 w-4 text-white/80" />
          </div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>
        
        {/* Navigation controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleScroll('left')}
            disabled={scrollPosition <= 0}
            className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${
              scrollPosition > 0 
                ? 'border-white/20 text-white hover:bg-white/10' 
                : 'border-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => handleScroll('right')}
            disabled={scrollPosition >= maxScroll}
            className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${
              scrollPosition < maxScroll 
                ? 'border-white/20 text-white hover:bg-white/10' 
                : 'border-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Card container */}
      <div className="relative">
        <div 
          ref={containerRef}
          className="flex gap-5 overflow-x-auto hide-scrollbar pb-6 snap-x snap-mandatory"
        >
          {properties.length > 0 ? (
            properties.map((property, index) => (
              <div 
                key={`${property.id || property.name}-${index}`} 
                className="min-w-[280px] md:min-w-[320px] snap-start"
              >
                <PropertyCard property={property} disableInteractions={disableInteractions} />
              </div>
            ))
          ) : (
            <div className="w-full py-12 text-center text-white/60">
              No properties found with the selected filters.
            </div>
          )}
        </div>
        
        {/* End of carousel indicator - shown only when user scrolls to the end */}
        {showEndIndicator && (
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 px-3 py-2 bg-black/80 backdrop-blur-sm rounded-lg text-sm text-white/90 border border-white/10 shadow-lg z-10 animate-fade-in-out">
            <div className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" />
              <span>End of results</span>
            </div>
          </div>
        )}
        
        {/* Progress bar */}
        {properties.length > 0 && (
          <div className="mt-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/40 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fade-in-out {
          animation: fadeInOut 2s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export { PropertyCard, PropertyCarousel };
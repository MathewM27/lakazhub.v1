'use client'

import { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Bed, Bath, ChevronLeft, ChevronRight, Home, MessageCircle, MessageSquare, Building, Calendar
} from "lucide-react";
import { Badge } from '@/components/ui/badge';

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
  customBadge?: string;
}

interface PropertyCarouselProps {
  title: string;
  properties: Property[];
  disableInteractions?: boolean; // New prop to disable interactions for all cards in carousel
  customBadge?: string;
}

// Individual Property Card Component
const PropertyCard = ({ property, disableInteractions = false, customBadge }: PropertyCardProps) => {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);

  // Make sure we have a valid image URL
  const imageUrl = property.image || 
    (property.images && property.images.length > 0 ? property.images[0] : '/placeholder-property.jpg');
  
  // Remove the handleSaveProperty function as it's no longer needed

  // Generate availability badge class
  const getAvailabilityBadgeClass = (): string => {
    switch (property.availability) {
      case 'Available': 
        return 'bg-emerald-500';
      case 'Rented':
        return 'bg-amber-500';
      case 'Coming Soon':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Format location name
  const formatLocation = (location: string) => {
    if (!location) return "Unknown Location";
    return location.charAt(0).toUpperCase() + location.slice(1);
  }

  return (
    <>
      <div 
        className={`h-full group bg-black border border-white/10 rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
          disableInteractions ? 'opacity-80 pointer-events-none select-none' : ''
        }`}
      >
        {/* Image Container - Updated to match landlord style */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <div 
            className="w-full h-full bg-cover bg-center transition-all duration-500 hover:scale-105" 
            style={{ backgroundImage: `url(${imageUrl})` }}
          ></div>
          
          {/* Status Badge - Top left */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
              <div className={`w-2 h-2 rounded-full ${getAvailabilityBadgeClass()}`}></div>
              <span className="text-white text-[11px] font-medium">
                {property.availability}
              </span>
            </div>
            {/* Show next_available_date for rented properties */}
            {property.availability === 'Rented' && property.next_available_date && (
              <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2.5 py-0.5 rounded-full ml-1">
                <Calendar className="w-2.5 h-2.5 text-white/70" />
                <span className="text-white text-[11px] font-medium">
                  {new Date(property.next_available_date).toLocaleDateString()}
                </span>
              </div>
            )}
            {/* Coming soon badge remains unchanged */}
            {property.availability === 'Coming Soon' && property.next_available_date && (
              <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2.5 py-0.5 rounded-full ml-1">
                <Calendar className="w-2.5 h-2.5 text-white/70" />
                <span className="text-white text-[11px] font-medium">
                  {new Date(property.next_available_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        
          {/* Custom Badge for messaged properties */}
          {customBadge && (
            <div className="absolute bottom-2.5 left-2.5 z-20">
              <Badge className="bg-blue-700/90 hover:bg-blue-600 text-white px-2 py-0.5 text-[10px] font-medium flex items-center">
                <MessageCircle className="mr-1 h-3.5 w-3.5" /> 
                {customBadge}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Content - Updated to match landlord style */}
        <div className="p-3.5">
          <div className="flex justify-between items-start mb-1.5">
            {/* Don't duplicate name here since it's now in the image overlay */}
            <h3 className="text-white font-semibold truncate max-w-[70%]">
              Rs {property.monthly_rent.toLocaleString()}
              <span className="text-xs text-white/70">/mo</span>
            </h3>
          </div>

          <div className="flex items-center text-[11px] text-white/70 mb-2.5">
            <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            <span className="truncate">{formatLocation(property.location)}</span>
          </div>

          {/* Property Features - Grid layout like landlord version */}
          <div className="grid grid-cols-3 gap-1.5 mb-3.5">
            <div className="bg-white/5 rounded-md p-1.5 flex justify-between items-center">
              <Bed className="w-4 h-4 text-white/70" />
              <p className="text-white text-[13px] font-medium">{property.bedrooms}</p>
            </div>
            
            <div className="bg-white/5 rounded-md p-1.5 flex justify-between items-center">
              <Bath className="w-4 h-4 text-white/70" />
              <p className="text-white text-[13px] font-medium">{property.bathrooms}</p>
            </div>
            
            <div className="bg-white/5 rounded-md p-1.5 flex justify-between items-center">
              {property.property_type === 'apartment' ? 
                <Building className="w-4 h-4 text-white/70" /> : 
                <Home className="w-4 h-4 text-white/70" />}
              <p className="text-white text-[13px] font-medium">
                {property.property_type === 'apartment' ? 'Apt' : 'House'}
              </p>
            </div>
          </div>
          
          {/* Action Buttons - Similar to landlord style */}
          {!disableInteractions && (
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setDetailModalOpen(true)}
                className="w-full py-3 px-3 flex justify-between items-center text-white text-[13px] font-medium bg-white/10 rounded-md hover:bg-white/15 transition-colors group"
              >
                View Details
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 duration-200" />
              </button>
              
              <button 
                className="w-full py-3 px-2.5 flex justify-center items-center gap-1.5 text-[13px] font-medium text-white bg-white/5 rounded-md hover:bg-white/10 transition-colors"
                onClick={() => setMessageModalOpen(true)}
              >
                <MessageSquare className="w-4 h-4" /> 
                Message Owner
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

      {/* Only render modals if interactions are enabled - Keep existing modal implementation */}
      {!disableInteractions && (
        <>
          <PropertyDetailModal
            property={property}
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
            onMessageLandlord={() => setMessageModalOpen(true)}
          />

          <TenantMessage
            open={messageModalOpen}
            onOpenChangeAction={setMessageModalOpen}
            property={property as unknown as Record<string, unknown>} // Fix type error
          />
        </>
      )}
    </>
  );
};

// Property Carousel Component
const PropertyCarousel = ({ title, properties, disableInteractions = false, customBadge }: PropertyCarouselProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [showEndIndicator, setShowEndIndicator] = useState(false);
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
                <PropertyCard property={property} disableInteractions={disableInteractions} customBadge={customBadge} />
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
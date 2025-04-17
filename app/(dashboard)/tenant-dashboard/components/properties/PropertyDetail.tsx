'use client'

import { useState } from 'react';
import Image from 'next/image';
import { 
  MapPin, Bed, Bath, Home, MessageSquare, Calendar, 
  Clock, X, ChevronLeft, ChevronRight,
  Wifi, Tv, Utensils, Car, Thermometer, ShowerHead, 
  Droplet, Zap, Trash, Flame, Tv2, DollarSign
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Property } from './property-layout/PropertyCard';

// Enhanced amenity icons mapping
const amenityIcons: { [key: string]: React.ComponentType<any> } = {
  // Property amenities
  wifi: Wifi,
  tv: Tv,
  kitchen: Utensils,
  parking: Car,
  heating: Thermometer,
  shower: ShowerHead,
  pool: Droplet,
  gym: Thermometer,
  furniture: Home,
  // Utilities as amenities
  water: Droplet,
  electricity: Zap,
  trash: Trash,
  gas: Flame,
  internet: Wifi,
  cable: Tv2,
};

interface PropertyDetailModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessageLandlord: () => void;
  // Removed onSaveProperty prop
}

const PropertyDetailModal = ({
  property,
  open,
  onOpenChange,
  onMessageLandlord,
}: PropertyDetailModalProps) => {
  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Function to convert utilities object to array of icon objects
  const getUtilitiesAsIcons = (utilities: Property['utilities']): { name: string; icon: string }[] => {
    if (!utilities) return [];
    
    const result: { name: string; icon: string }[] = [];
    if (utilities.water) result.push({ name: 'Water', icon: 'water' });
    if (utilities.electricity) result.push({ name: 'Electricity', icon: 'electricity' });
    if (utilities.internet) result.push({ name: 'Internet', icon: 'internet' });
    if (utilities.gas) result.push({ name: 'Gas', icon: 'gas' });
    if (utilities.trash) result.push({ name: 'Trash', icon: 'trash' });
    if (utilities.cable) result.push({ name: 'Cable', icon: 'cable' });
    
    return result;
  };
  
  // Check if property is rented
  const isRented = property.status === 'rented' || property.available === false;
  
  // Add default/mock data for empty property fields
  const enhancedProperty = {
    ...property,
    contractLength: "12 months",
    utilities: getUtilitiesAsIcons(property.utilities),
    amenities: property.amenities || [],
    availableDate: property.next_available_date || null
  };

  // Combine utilities and amenities into a single array for display
  const allAmenities = [...enhancedProperty.utilities, ...(enhancedProperty.amenities || [])];

  // Image navigation functions
  const goToPrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (enhancedProperty.images?.length || 1) - 1 : prev - 1
    );
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === (enhancedProperty.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/95 backdrop-blur-xl border border-white/20 text-white max-w-xl md:max-w-xl p-0 overflow-hidden w-[40vw] h-auto">
        <DialogHeader className="p-4 border-b border-white/10">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg md:text-xl font-bold text-white line-clamp-1">{enhancedProperty.name}</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="flex items-center text-white/60 mt-1 text-sm">
            <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="line-clamp-1">{enhancedProperty.location}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Image Carousel - Slightly taller */}
          <div className="relative w-full h-48 sm:h-52 md:h-56">
            {enhancedProperty.images && enhancedProperty.images.length > 0 ? (
              <Image 
                src={enhancedProperty.images[currentImageIndex] || '/placeholder-property.jpg'} 
                alt={`${enhancedProperty.name} - Image ${currentImageIndex + 1}`}
                fill
                className="object-cover"
                onError={(e) => {
                  // console.error("Failed to load image:", enhancedProperty.images?.[currentImageIndex]);
                  (e.target as HTMLImageElement).src = '/placeholder-property.jpg';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <Home className="h-12 w-12 text-gray-600" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
            
            {/* Only show navigation if we have multiple images */}
            {enhancedProperty.images && enhancedProperty.images.length > 1 && (
              <>
                <button 
                  onClick={goToPrevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                  onClick={goToNextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                
                <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/60 text-sm text-white/90">
                  {currentImageIndex + 1} / {enhancedProperty.images.length}
                </div>
              </>
            )}
          </div>
          
          {/* Main content - Better organized layout */}
          <div className="p-4 md:p-5">
            {/* Price, status and key metrics */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-white">
                  Rs {enhancedProperty.monthly_rent.toLocaleString()}
                  <span className="text-sm font-normal text-white/70">/month</span>
                </h3>
                <div className={`inline-block px-2.5 py-1 mt-1.5 rounded-full text-sm font-medium ${
                  enhancedProperty.availability === 'Available' ? 'bg-green-900/30 text-green-300' : 
                  enhancedProperty.availability === 'Rented' ? 'bg-red-900/30 text-red-300' : 
                  'bg-yellow-900/30 text-yellow-300'
                }`}>
                  {enhancedProperty.availability || (enhancedProperty.available ? 'Available' : 'Not Available')}
                </div>
              </div>
              
              {/* Property specs */}
              <div className="flex items-start justify-end gap-2.5">
                <div className="flex items-center bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                  <Bed className="h-4 w-4 text-white/70 mr-1.5" />
                  <span className="text-sm">{enhancedProperty.bedrooms}</span>
                </div>
                <div className="flex items-center bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                  <Bath className="h-4 w-4 text-white/70 mr-1.5" />
                  <span className="text-sm">{enhancedProperty.bathrooms}</span>
                </div>
              </div>
            </div>
            
            {/* Key property details in a more compact grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {/* Contract length */}
              <div className="flex items-center bg-white/5 rounded-lg p-3 border border-white/10">
                
                <div className='flex items-center'>
                <Clock className="h-4.5 w-4.5 text-white/70 mr-2.5 flex-shrink-0" />
                  <div className="text-sm text-white">{enhancedProperty.contractLength}</div>
                </div>
              </div>
              
              {/* Security deposit */}
              <div className="flex items-center bg-white/5 rounded-lg p-3 border border-white/10">
                
                <div className='flex items-center'>
                <DollarSign className="h-4.5 w-4.5 text-white/70 mr-2.5 flex-shrink-0" />
                  <div className="text-sm text-white">Rs {enhancedProperty.security_deposit.toLocaleString()}</div>
                </div>
              </div>
              
              {/* Next Available Date - Only for rented properties */}
              {isRented && enhancedProperty.availableDate && (
                <div className="flex items-center bg-white/5 rounded-lg p-3 border border-white/10 col-span-2">
                  <Calendar className="h-4.5 w-4.5 text-white/70 mr-2.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs uppercase text-white/60 leading-tight">Next Available</div>
                    <div className="text-sm text-white">{formatDate(enhancedProperty.availableDate)}</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Amenities using an organized approach with inline icons */}
            <div className="mb-3">
              <h3 className="text-xs uppercase text-white/70 mb-3">Amenities & Utilities</h3>
              
              {allAmenities.length > 0 ? (
                <div className="grid grid-cols-3 gap-x-3 gap-y-2 justify-between">
                  {allAmenities.map((amenity, index) => {
                    const AmenityIcon = amenityIcons[amenity.icon as keyof typeof amenityIcons] || Home;
                    return (
                      <div key={index} className="flex items-center text-white/70">
                        <AmenityIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm truncate">{amenity.name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-2 text-white/50 text-sm">
                  No amenities or utilities included
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer Actions - Modified to have only Message Landlord button */}
        <div className="flex p-4 border-t border-white/10">
          <Button 
            className="flex-1 bg-white text-black hover:bg-white/90 text-sm py-2 h-auto"
            onClick={onMessageLandlord}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Message Landlord
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDetailModal;
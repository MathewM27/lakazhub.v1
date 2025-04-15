import Image from 'next/image';
import { properties } from '@/utils/types/properties'; // Import properties array
import { BedDouble, Bath, Users, ArrowRight } from 'lucide-react';

// Define the correct type based on the properties array
type PropertyType = typeof properties[number];

interface PropertyCardProps {
  property: PropertyType;
  onClick: () => void;
}

export const PropertyCard = ({ property, onClick }: PropertyCardProps) => {
  return (
    <div 
      className="bg-black border border-white/10 rounded-xl overflow-hidden h-full"
      onClick={onClick}
    >
      {/* Property image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={property.imageUrl || '/default-image.jpg'} 
          alt={property.name} // Changed from title to name
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700"
          quality={80}
        />
        
        {/* Property type badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white">
          {property.type}
        </div>
      </div>
      
      {/* Property details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">{property.name}</h3> {/* Changed from title to name */}
        
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="flex items-center text-xs text-white/70">
            <BedDouble className="w-3 h-3 mr-1" />
            <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</span> {/* Changed from beds to bedrooms */}
          </div>
          
          <div className="flex items-center text-xs text-white/70">
            <Bath className="w-3 h-3 mr-1" />
            <span>{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</span> {/* Changed from baths to bathrooms */}
          </div>
          
          <div className="flex items-center text-xs text-white/70">
            <Users className="w-3 h-3 mr-1" />
            <span>Up to {(property.area ?? 0) / 30} Guests</span> {/* Using area as approximation for guests since there's no guests field */}
          </div>
        </div>
        
        {/* Price and call to action */}
        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-lg font-bold text-white">Rs {property.price}</span>
            <span className="text-xs text-white/70 ml-1">/month</span>
          </div>
          
          <div className="flex items-center text-xs text-white font-medium cursor-pointer group">
            View details
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

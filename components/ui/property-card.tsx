'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Property } from '@/utils/types/property';
import { Bed, Bath, Square, Home } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
}

export const PropertyCard = ({ property, onClick }: PropertyCardProps) => {
  const truncateString = (str: string, numWords: number) => {
    const words = str.split(' ');
    if (words.length > numWords) {
      return words.slice(0, numWords).join(' ') + '...';
    }
    return str;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg cursor-pointer group relative"
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
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/20"
        >
          {property.type || 'For Rent'}
        </motion.div>
      </div>

      <div className="relative h-52 w-full overflow-hidden">
        {/* Use a fallback image if property.imageUrl is missing or invalid */}
        <Image
          src={property.imageUrl || '/bg1.jpg'}
          alt={property.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = '/images/property-placeholder.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/60 group-hover:to-black/80 transition-all duration-300" />
      </div>

      {/* Content Container */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-white/90 transition-colors">
              {truncateString(property.name, 2)}
            </h3>
            <p className="text-white/70 flex items-center gap-1 text-sm mt-1">
              <Home className="w-3.5 h-3.5" />
              {property.location}
            </p>
          </div>
          
          <div className="text-right">
            <div className="bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm">
              <p className="text-white font-bold">
                Rs {property.price.toLocaleString()}
              </p>
              <p className="text-white/60 text-xs">per month</p>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent my-3"></div>
        
        {/* Features */}
        <div className="flex justify-between mt-3 text-white/70">
          <motion.div 
            whileHover={{ y: -3, color: 'rgba(255, 255, 255, 0.9)' }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Bed className="w-4 h-4" />
            </div>
            <span className="text-xs">{property.bedrooms} Beds</span>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -3, color: 'rgba(255, 255, 255, 0.9)' }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Bath className="w-4 h-4" />
            </div>
            <span className="text-xs">{property.bathrooms} Baths</span>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -3, color: 'rgba(255, 255, 255, 0.9)' }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Square className="w-4 h-4" />
            </div>
            <span className="text-xs">{property.area}m²</span>
          </motion.div>
        </div>
        
        {/* View Details Button */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="mt-4 w-full"
        >
          <button 
            className="w-full py-2 bg-transparent border border-white/20 rounded-lg text-white text-sm group-hover:bg-white group-hover:text-black transition-all duration-300"
          >
            View Details
          </button>
        </motion.div>
      </div>
      
      {/* Animated border effect */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-xl pointer-events-none transition-colors duration-300"
      ></motion.div>
    </motion.div>
  );
};
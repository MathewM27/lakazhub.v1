import React, { useEffect, useState } from 'react';
import { PropertyCarousel, type Property } from './property-layout/PropertyCard';
import { supabase } from '../../utils/supabase/client';

const RENTED_CACHE_KEY = 'rented_properties_cache';
const RENTED_CACHE_EXPIRY = 1000 * 60 * 60 * 24 * 3; // 3 days
const PAGE_SIZE = 10;

const getAvailabilityLabel = (available: boolean, status: string): 'Available' | 'Rented' | 'Coming Soon' => {
  return status === 'pending'
    ? 'Coming Soon'
    : (status === 'rented' || !available)
      ? 'Rented'
      : 'Available';
};

const parseAmenities = (amenitiesArray: string[] | null): { name: string; icon: string }[] => {
  if (!amenitiesArray || !Array.isArray(amenitiesArray)) return [];
  return amenitiesArray.map(amenity => ({
    name: amenity.charAt(0).toUpperCase() + amenity.slice(1),
    icon: amenity // icon mapping can be improved if needed
  }));
};

const RentedProperties: React.FC = () => {
  const [rentedProperties, setRentedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchRented() {
      setLoading(true);
      // Try cache first
      const cache = localStorage.getItem(RENTED_CACHE_KEY);
      if (cache) {
        const { properties, timestamp } = JSON.parse(cache);
        if (Date.now() - timestamp < RENTED_CACHE_EXPIRY && properties.length > 0) {
          setRentedProperties(properties);
          setLoading(false);
          return;
        }
      }
      // Query rented properties directly from Supabase
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .or('status.eq.rented,available.eq.false')
        .order('updated_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) {
        console.error('[RentedProperties] Supabase fetch error:', error);
        setRentedProperties([]);
        setLoading(false);
        return;
      }

      // Debug: show what is returned
      console.log('[RentedProperties] Supabase rented properties:', data);

      if (!data || data.length === 0) {
        // If you see this, check your RLS policy for tenants
        console.warn('[RentedProperties] No rented properties returned. This may be due to RLS policy.');
        setRentedProperties([]);
        setLoading(false);
        return;
      }

      // Transform for PropertyCard
      const transformed: Property[] = (data as Array<Record<string, any>>).map(item => ({
        id: item.id as string,
        landlord_id: item.landlord_id as string,
        name: (item.name as string) || 'Unnamed Property',
        location: (item.location as string) || 'Unknown Location',
        property_type: (item.property_type as string) || 'apartment',
        bedrooms: Number(item.bedrooms) || 0,
        bathrooms: Number(item.bathrooms) || 0,
        description: (item.description as string) || '',
        monthly_rent: Number(item.monthly_rent) || 0,
        security_deposit: Number(item.security_deposit) || 0,
        utilities: (item.utilities as Property['utilities']) || {
          water: false,
          electricity: false,
          internet: false,
          gas: false,
          trash: false,
          cable: false
        },
        images: Array.isArray(item.images) ? item.images as string[] : ['/placeholder-property.jpg'],
        image: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '/placeholder-property.jpg',
        available: !!item.available,
        status: (item.status as 'active' | 'archived' | 'pending' | 'rented') || 'active',
        created_at: item.created_at as string,
        updated_at: item.updated_at as string,
        amenities: parseAmenities(item.amenities as string[]),
        rules: (item.rules as string[]) || [],
        next_available_date: item.next_available_date as string,
        availability: getAvailabilityLabel(!!item.available, (item.status as string) || ''),
        price: typeof item.price === 'number' ? item.price : Number(item.monthly_rent) || 0,
        area: typeof item.area === 'number' ? item.area : 0,
        imageErrorHandler: (e: React.SyntheticEvent<HTMLImageElement>) => {
          e.currentTarget.src = '/placeholder-property.jpg';
        }
      }));

      if (mounted) {
        setRentedProperties(transformed);
        setLoading(false);
        localStorage.setItem(RENTED_CACHE_KEY, JSON.stringify({
          properties: transformed,
          timestamp: Date.now()
        }));
      }
    }
    fetchRented();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="property-section mt-8 relative">
        <div className="border-t border-white/10 pt-8">
          <div className="text-white/60 text-center py-8">Loading rented properties...</div>
        </div>
      </div>
    );
  }
  if (rentedProperties.length === 0) {
    return (
      <div className="property-section mt-8 relative">
        <div className="border-t border-white/10 pt-8">
          <div className="text-white/60 text-center py-8">
            No rented properties to display.
            {/* If you see this and you know there are rented properties, check your RLS policy for tenants. */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="property-section mt-8 relative">
      <div className="border-t border-white/10 pt-8">
        <PropertyCarousel
          title="Previously Rented"
          properties={rentedProperties}
          disableInteractions={true}
        />
      </div>
    </div>
  );
};

export default RentedProperties;

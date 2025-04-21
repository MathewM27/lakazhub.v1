import React, { useEffect, useState, useCallback } from 'react';
import { PropertyCarousel, type Property } from './property-layout/PropertyCard';
import { supabase } from '../../utils/supabase/client';

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
    icon: amenity
  }));
};

const RentedProperties: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRented = useCallback(async (pageNum = 1) => {
    setIsLoading(true);
    const from = (pageNum - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error, count } = await supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .or('status.eq.rented,available.eq.false')
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (error) {
      setIsLoading(false);
      return;
    }
    const newProps = ((data as Array<Record<string, any>>) || []).map(item => ({
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
    setProperties((prev) => (pageNum === 1 ? newProps : [...prev, ...newProps]));
    setHasMore((pageNum === 1 ? newProps.length : properties.length + newProps.length) < (count || 0));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRented(1);
    setPage(1);
  }, [fetchRented]);

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRented(nextPage);
  };

  if (properties.length === 0 && !isLoading) return null;

  return (
    <div className="property-section mt-8 relative">
      <div className="border-t border-white/10 pt-8">
        <PropertyCarousel
          title="Previously Rented"
          properties={properties}
          disableInteractions={true}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoadingMore={isLoading && page > 1}
        />
      </div>
    </div>
  );
};

export default RentedProperties;

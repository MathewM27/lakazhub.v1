import React, { useEffect, useState, useCallback } from 'react';
import { PropertyCarousel, type Property } from './property-layout/PropertyCard';
import { supabase } from '../../utils/supabase/client';

const PAGE_SIZE = 10;

// Helper to get correct availability label
function getAvailabilityLabel(available: boolean, status: string): 'Available' | 'Rented' | 'Coming Soon' {
  return status === 'pending'
    ? 'Coming Soon'
    : (status === 'rented' || !available)
      ? 'Rented'
      : 'Available';
}

const AvailableProperties: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAvailable = useCallback(async (pageNum = 1) => {
    setIsLoading(true);
    const from = (pageNum - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error, count } = await supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('available', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      setIsLoading(false);
      return;
    }
    const newProps = ((data as Property[]) || []).map(item => ({
      ...item,
      availability: getAvailabilityLabel(item.available, item.status || ''),
    }));

    setProperties(prev =>
      pageNum === 1 ? newProps : [...prev, ...newProps]
    );
    setHasMore(prev => {
      const totalLoaded = pageNum === 1 ? newProps.length : properties.length + newProps.length;
      return totalLoaded < (count || 0);
    });
    setIsLoading(false);
  }, []); // <-- No dependency on properties.length

  useEffect(() => {
    fetchAvailable(1);
    setPage(1);
  }, [fetchAvailable]);

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAvailable(nextPage);
  };

  if (properties.length === 0 && !isLoading) return null;

  return (
    <div className="property-section mb-16 relative">
      <PropertyCarousel
        title="Available Properties"
        properties={properties}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoadingMore={isLoading && page > 1}
      />
    </div>
  );
};

export default AvailableProperties;

import React, { useMemo, useState } from 'react';
import { PropertyCarousel, type Property } from './property-layout/PropertyCard';

function getAvailabilityLabel(available: boolean, status: string): 'Available' | 'Rented' | 'Coming Soon' {
  return status === 'pending'
    ? 'Coming Soon'
    : (status === 'rented' || !available)
      ? 'Rented'
      : 'Available';
}

const PAGE_SIZE = 10;

interface RecentlyAddedProps {
  allProperties: Property[];
  loading?: boolean;
}

const RecentlyAdded: React.FC<RecentlyAddedProps> = ({ allProperties, loading }) => {
  const recentlyAddedProperties = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return allProperties
      .filter(p => {
        const createdDate = new Date(p.created_at);
        return createdDate > sevenDaysAgo && p.available === true && p.status === 'active';
      })
      .map(p => ({
        ...p,
        availability: getAvailabilityLabel(p.available, p.status || ''),
      }));
  }, [allProperties]);

  // Pagination state
  const [page, setPage] = useState(1);
  const paginatedProperties = useMemo(
    () => recentlyAddedProperties.slice(0, page * PAGE_SIZE),
    [recentlyAddedProperties, page]
  );
  const hasMore = paginatedProperties.length < recentlyAddedProperties.length;

  if ((recentlyAddedProperties.length === 0 && !loading) || !allProperties) return null;

  return (
    <div className="property-section mb-16 relative">
      <PropertyCarousel
        title="Recently Added"
        properties={paginatedProperties}
        onLoadMore={() => setPage(p => p + 1)}
        hasMore={hasMore}
        isLoadingMore={false}
      />
    </div>
  );
};

export default RecentlyAdded;

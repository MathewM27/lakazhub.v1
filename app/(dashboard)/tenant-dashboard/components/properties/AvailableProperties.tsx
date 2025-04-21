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

interface AvailablePropertiesProps {
  allProperties: Property[];
  loading?: boolean;
}

const AvailableProperties: React.FC<AvailablePropertiesProps> = ({ allProperties, loading }) => {
  const availableProperties = useMemo(
    () =>
      allProperties
        .filter(p => p.available === true && p.status === 'active')
        .map(p => ({
          ...p,
          availability: getAvailabilityLabel(p.available, p.status || ''),
        })),
    [allProperties]
  );

  // Pagination state
  const [page, setPage] = useState(1);
  const paginatedProperties = useMemo(
    () => availableProperties.slice(0, page * PAGE_SIZE),
    [availableProperties, page]
  );
  const hasMore = paginatedProperties.length < availableProperties.length;

  if ((availableProperties.length === 0 && !loading) || !allProperties) return null;

  return (
    <div className="property-section mb-16 relative">
      <PropertyCarousel
        title="Available Properties"
        properties={paginatedProperties}
        onLoadMore={() => setPage(p => p + 1)}
        hasMore={hasMore}
        isLoadingMore={false}
      />
    </div>
  );
};

export default AvailableProperties;

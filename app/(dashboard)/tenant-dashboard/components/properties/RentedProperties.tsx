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

interface RentedPropertiesProps {
  allProperties: Property[];
  loading?: boolean;
}

const RentedProperties: React.FC<RentedPropertiesProps> = ({ allProperties, loading }) => {
  const rentedProperties = useMemo(
    () =>
      allProperties
        .filter(p => p.status === 'rented' || p.available === false)
        .map(p => ({
          ...p,
          availability: getAvailabilityLabel(p.available, p.status || ''),
        })),
    [allProperties]
  );

  // Pagination state
  const [page, setPage] = useState(1);
  const paginatedProperties = useMemo(
    () => rentedProperties.slice(0, page * PAGE_SIZE),
    [rentedProperties, page]
  );
  const hasMore = paginatedProperties.length < rentedProperties.length;

  if ((rentedProperties.length === 0 && !loading) || !allProperties) return null;

  return (
    <div className="property-section mt-8 relative">
      <div className="border-t border-white/10 pt-8">
        <PropertyCarousel
          title="Previously Rented"
          properties={paginatedProperties}
          disableInteractions={true}
          onLoadMore={() => setPage(p => p + 1)}
          hasMore={hasMore}
          isLoadingMore={false}
        />
      </div>
    </div>
  );
};

export default RentedProperties;

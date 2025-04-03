import React from 'react';
import { PropertyCarousel, type Property } from './property-layout/PropertyCard';

interface RecentlyAddedProps {
  recentlyAddedProperties: Property[];
}

const RecentlyAdded: React.FC<RecentlyAddedProps> = ({ recentlyAddedProperties }) => {
  return (
    <>
      {recentlyAddedProperties.length > 0 && (
        <div className="property-section mb-16 relative">
          <PropertyCarousel 
            title="Recently Added" 
            properties={recentlyAddedProperties}
          />
        </div>
      )}
    </>
  );
};

export default RecentlyAdded;

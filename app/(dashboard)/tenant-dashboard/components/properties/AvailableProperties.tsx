import React from 'react';
import { PropertyCarousel, type Property } from './property-layout/PropertyCard';

interface AvailablePropertiesProps {
  availableProperties: Property[];
}

const AvailableProperties: React.FC<AvailablePropertiesProps> = ({ availableProperties }) => {
  return (
    <>
      {availableProperties.length > 0 && (
        <div className="property-section mb-16 relative">
          <PropertyCarousel 
            title="Available Properties" 
            properties={availableProperties}
          />
        </div>
      )}
    </>
  );
};

export default AvailableProperties;

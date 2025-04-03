import React from 'react';
import { PropertyCarousel, type Property } from './property-layout/PropertyCard';

interface RentedPropertiesProps {
  rentedProperties: Property[];
}

const RentedProperties: React.FC<RentedPropertiesProps> = ({ rentedProperties }) => {
  return (
    <>
      {rentedProperties.length > 0 && (
        <div className="property-section mt-8 relative">
          <div className="border-t border-white/10 pt-8">
            <PropertyCarousel 
              title="Previously Rented" 
              properties={rentedProperties}
              disableInteractions={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default RentedProperties;

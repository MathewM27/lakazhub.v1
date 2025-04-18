import React from 'react';
import { PropertyCarousel, type Property } from './property-layout/PropertyCard';
import { cn } from '@/utils/lib/utils';

interface MessagedPropertiesProps {
  messagedProperties: Property[];
  className?: string;
}

const MessagedProperties: React.FC<MessagedPropertiesProps> = ({ messagedProperties, className }) => {

  // Debug whether we're returning null or rendering the component
  if (!messagedProperties || messagedProperties.length === 0) {
    return null;
  }

  return (
    <div className={cn("property-section mb-16 relative", className)}>
      {/* Add a special indicator for messaged properties section */}
      <PropertyCarousel 
        title="Properties You've Messaged" 
        properties={messagedProperties}
        customBadge="Conversation"
      />
    </div>
  );
};

export default MessagedProperties;

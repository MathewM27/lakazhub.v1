import React from 'react';
import { PropertyCarousel, type Property } from './property-layout/PropertyCard';
import { cn } from '@/utils/lib/utils';

interface MessagedPropertiesProps {
  messagedProperties: Property[];
  className?: string;
}

const MessagedProperties: React.FC<MessagedPropertiesProps> = ({ messagedProperties, className }) => {
  if (!messagedProperties || messagedProperties.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-black relative overflow-hidden">
      <div className={cn("max-w-screen-xl mx-auto px-4 md:px-8 relative z-10", className)}>
        <div className="property-section mb-16 relative">
          <PropertyCarousel 
            title="Properties You've Messaged" 
            properties={messagedProperties}
            customBadge="Conversation"
          />
        </div>
      </div>
    </section>
  );
};

export default MessagedProperties;

import React, { useState, useMemo } from 'react';
import { PropertyCarousel, type Property } from './property-layout/PropertyCard';
import { cn } from '@/utils/lib/utils';

interface MessagedPropertiesProps {
  messagedProperties: Property[];
  className?: string;
}

const MessagedProperties: React.FC<MessagedPropertiesProps> = ({ messagedProperties, className }) => {
  // Pagination state for messaged properties
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const paginatedProperties = useMemo(
    () => messagedProperties.slice(0, page * PAGE_SIZE),
    [messagedProperties, page]
  );
  const hasMore = paginatedProperties.length < messagedProperties.length;

  // Debug whether we're returning null or rendering the component
  if (!messagedProperties || messagedProperties.length === 0) {
    return null;
  }

  return (
    <div className={cn("property-section mb-16 relative", className)}>
      {/* Add a special indicator for messaged properties section */}
      <PropertyCarousel 
        title="Properties You've Messaged" 
        properties={paginatedProperties}
        customBadge="Conversation"
        // Only show load more if there are more than 5 messaged properties
        onLoadMore={messagedProperties.length > 5 ? () => setPage(p => p + 1) : undefined}
        hasMore={messagedProperties.length > 5 ? hasMore : false}
      />
    </div>
  );
};

export default MessagedProperties;

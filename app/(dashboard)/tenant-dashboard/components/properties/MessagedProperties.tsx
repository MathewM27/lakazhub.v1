import React, { useEffect, useState } from 'react';
import { PropertyCarousel, type Property } from './property-layout/PropertyCard';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/utils/lib/utils';
import { supabase } from '../../utils/supabase/client';

interface MessagedPropertiesProps {
  messagedProperties: Property[];
  className?: string;
}

const MessagedProperties: React.FC<MessagedPropertiesProps> = ({ messagedProperties, className }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Enhanced debugging for MessagedProperties component
  useEffect(() => {
    console.log("=== MESSAGED PROPERTIES DEBUG ===");
    console.log("Component received properties:", messagedProperties?.length || 0);
    
    if (messagedProperties?.length > 0) {
      console.log("First messaged property details:", {
        id: messagedProperties[0].id,
        name: messagedProperties[0].name,
        bedrooms: messagedProperties[0].bedrooms,
        image: messagedProperties[0].image || messagedProperties[0].images?.[0],
        images: messagedProperties[0].images?.length || 0,
        isArray: Array.isArray(messagedProperties[0].images)
      });
    } else {
      console.log("No messaged properties received");
    }
    console.log("===============================");
  }, [messagedProperties]);

  // Debug whether we're returning null or rendering the component
  if ((!messagedProperties || messagedProperties.length === 0) && !isLoading) {
    console.log("MessagedProperties: Returning null - no properties and not loading");
    return null;
  }

  console.log("MessagedProperties: Rendering component with", messagedProperties?.length || 0, "properties");
  
  return (
    <div className={cn("property-section mb-16 relative", className)}>
      {/* Add a special indicator for messaged properties section */}
    
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white/5 rounded-xl">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-150"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-300"></div>
          </div>
        </div>
      ) : (
        <>
          <PropertyCarousel 
            title="Properties You've Messaged" 
            properties={messagedProperties}
            customBadge="..."
          />
          
          
        </>
      )}
    </div>
  );
};

export default MessagedProperties;

import React, { useEffect } from 'react';
import { PropertyCarousel, type Property } from './property-layout/PropertyCard';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FiInfo, FiX } from 'react-icons/fi';

interface PreferencesProps {
  preferredProperties: Property[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

const Preferences: React.FC<PreferencesProps> = ({ preferredProperties, hasActiveFilters, clearFilters }) => {
  // Debug logging for Preferences component
  useEffect(() => {
    // console.log("=== PREFERENCES COMPONENT ===");
    // console.log("hasActiveFilters:", hasActiveFilters);
    // console.log("preferredProperties.length:", preferredProperties.length);
    // console.log("Should display properties:", hasActiveFilters && preferredProperties.length > 0);
    // console.log("Should display no match alert:", hasActiveFilters && preferredProperties.length === 0);
    
    // Log first 3 properties if available (for debugging)
    // if (preferredProperties.length > 0) {
    //   const sampleProps = preferredProperties.slice(0, 3).map(p => ({
    //     id: p.id.substring(0, 8),
    //     name: p.name,
    //     bedrooms: p.bedrooms
    //   }));
    //   console.log("Sample preferred properties:", sampleProps);
    // }
    
    // console.log("=============================");
  }, [preferredProperties, hasActiveFilters]);
  
  // If no filters are active, don't show anything
  if (!hasActiveFilters) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-black relative overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 relative z-10">
        {preferredProperties.length > 0 ? (
          <div className="property-section mb-16 relative">
            <PropertyCarousel 
              title="Your Preferences" 
              properties={preferredProperties}
            />
          </div>
        ) : (
          <div className="mb-16">
            <Alert className="bg-white/5 border border-white/10 text-white">
              <div className="flex items-start">
                <FiInfo className="h-5 w-5 text-white/70 mr-3 mt-0.5" />
                <AlertDescription className="text-white/90">
                  <h3 className="text-lg font-medium mb-1">No matching properties found</h3>
                  <p className="text-sm text-white/70 mb-3">
                    We couldn&apos;t find any properties that match your current filters. 
                    Try adjusting your criteria for better results.
                  </p>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <FiX className="h-3.5 w-3.5 mr-1.5" />
                    Clear Filters
                  </Button>
                </AlertDescription>
              </div>
            </Alert>
          </div>
        )}
      </div>
    </section>
  );
};

export default Preferences;

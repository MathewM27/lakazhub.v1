"use client";

import PropertyCard from "./property-card";
import { Property } from "../../types";
import { Plus, Home, RefreshCw } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useProperties } from "../../hooks/useProperties";
import { deleteProperty } from "../../lib/utils/services/PropertyService";
import { useToast } from "../../hooks/use-toast";
import NotificationsModal from "../modals/notification-modal";

interface PropertyGridProps {
  onPropertyDetailsAction: (property: Property) => void;
  onAvailabilityAction: (property: Property) => void;
  onAddNewPropertyAction: () => void;
  onRefreshNeeded?: (refreshFunction: () => Promise<Property[] | void>) => void;
}

export default function PropertyGrid({ 
  onPropertyDetailsAction, 
  onAvailabilityAction, 
  onAddNewPropertyAction,
  onRefreshNeeded 
}: PropertyGridProps) {
  // Removed activeFilter state since we're removing the filter buttons
  const { properties, loading, error, refreshProperties } = useProperties();
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const { toast } = useToast();
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    refreshProperties().then(() => {
      toast({
        title: "Properties refreshed",
        description: "Your property list has been updated.",
      });
    }).catch(err => {
      toast({
        title: "Refresh failed",
        description: err.message || "Could not refresh properties",
        variant: "destructive",
      });
    });
  }, [refreshProperties, toast]);

  // Add this function to handle property deletion
  const handleDeleteProperty = async (propertyId: string) => {
    try {
      setDeletingPropertyId(propertyId);
      
      const result = await deleteProperty(propertyId);
      
      if (result.success) {
        toast({
          title: "Property deleted",
          description: "The property has been successfully deleted",
          variant: "default"
        });
        
        // Refresh the properties list
        refreshProperties();
      } else {
        toast({
          title: "Delete failed",
          description: "There was an error deleting the property. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      // Comment out console.error
      // console.error('Error during property deletion:', error);
      toast({
        title: "Delete failed",
        description: "Unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingPropertyId(null);
    }
  };

  const handleNotificationClick = (property: Property) => {
    setSelectedProperty(property);
    setNotificationModalOpen(true);
  };

  // When the component mounts, expose the refresh function to parent components
  useEffect(() => {
    if (onRefreshNeeded) {
      onRefreshNeeded(refreshProperties);
    }
  }, [onRefreshNeeded, refreshProperties]);

  return (
    <section className="py-12 bg-black relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-px h-full bg-white/5" 
            style={{ left: `${i * 10}%` }}
          ></div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div 
          className="max-w-6xl mx-auto opacity-0 translate-y-5 animate-fade-in-up"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div className="max-w-2xl">
              <div
                className="flex items-center gap-2 mb-4 opacity-0 translate-y-2 animate-fade-in-up"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <Home className="w-4 h-4 text-black" />
                </div>
                <span className="text-white/70 text-sm font-medium">Your Property Portfolio</span>
              </div>
              
              <h2 
                className="text-3xl md:text-4xl font-bold mb-4 text-white opacity-0 translate-y-2 animate-fade-in-up animation-delay-100"
              >
                Manage Your Properties
              </h2>
              
              <p 
                className="text-base md:text-lg text-white/70 opacity-0 translate-y-2 animate-fade-in-up animation-delay-200"
              >
                View and manage all your properties in one place with real-time information
              </p>
            </div>
            
            {/* Refresh button - Keeping only this button */}
            <div className="mt-6 md:mt-0">
              <button
                onClick={handleRefresh} 
                className="px-4 py-2 text-sm rounded-full transition-all duration-300 bg-white/10 text-white/70 hover:bg-white/20 opacity-0 translate-y-2 animate-fade-in-up animation-delay-300 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loading ? (
              <div 
                className="col-span-3 flex flex-col items-center justify-center py-20 space-y-4 opacity-0 animate-fade-in"
              >
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                <p className="text-white/70">Loading properties...</p>
              </div>
            ) : error ? (
              <div 
                className="col-span-3 text-center py-12 px-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 opacity-0 animate-fade-in"
              >
                <h3 className="text-xl font-semibold text-red-400 mb-2">Error loading properties</h3>
                <p className="text-white/80 mb-4">{error.message}</p>
                <button 
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : Array.isArray(properties) && properties.length > 0 ? (
              properties.map((property, index) => (
                <div 
                  key={property.id}
                  className={`transform transition-all duration-300 hover:-translate-y-2.5 opacity-0 animate-fade-in-up ${
                    deletingPropertyId === property.id ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <PropertyCard
                    property={property}
                    onDetailsAction={() => onPropertyDetailsAction(property)}
                    onAvailabilityAction={() => onAvailabilityAction(property)}
                    onNotificationsAction={handleNotificationClick}
                    onDeleteAction={handleDeleteProperty}
                  />
                </div>
              ))
            ) : (
              <p 
                className="text-white col-span-3 text-center py-12 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 opacity-0 animate-fade-in"
              >
                No properties found
              </p>
            )}

            <div 
              className="flex items-center justify-center border-dashed border-2 border-white/30 rounded-xl bg-white/5 backdrop-blur-sm overflow-hidden opacity-0 animate-fade-in-up animation-delay-300 hover:-translate-y-2.5 transition-all duration-300"
            >
              <button
                onClick={onAddNewPropertyAction}
                className="flex flex-col items-center justify-center w-full h-full py-14 px-6 text-white/80 hover:text-white transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-all">
                  <Plus className="w-7 h-7" />
                </div>
                <span className="font-medium text-lg">Add New Property</span>
                <p className="text-white/50 text-sm mt-2 text-center max-w-[200px]">
                  Click here to add a new property to your portfolio
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
      <NotificationsModal 
        open={notificationModalOpen}
        onOpenChangeAction={setNotificationModalOpen}
        property={selectedProperty ? {
          ...selectedProperty,
          id: selectedProperty.id,
          name: selectedProperty.name
        } : undefined}
      />
    </section>
  );
}
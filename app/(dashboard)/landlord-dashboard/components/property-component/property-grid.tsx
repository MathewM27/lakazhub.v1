"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import PropertyCard from "./property-card";
import { Property } from "../../types";
import { Plus, Home, RefreshCw } from "lucide-react";
import { useProperties } from "../../hooks/useProperties";
import { supabase } from "../../lib/utils/supabase/client";
import { PropertyCache } from "../../lib/utils/cache/propertyCache";
import { useToast } from "../../hooks/use-toast";
import dynamic from "next/dynamic";

// Dynamically import modals/dialogs
const NotificationsModal = dynamic(() => import("../modals/notification-modal"), { ssr: false });

interface PropertyGridProps {
  onPropertyDetailsAction: (property: Property) => void;
  onAvailabilityAction: (property: Property) => void;
  onAddNewPropertyAction: () => void;
  onRefreshNeeded?: (refreshFunction: () => Promise<Property[] | void>) => void;
  refreshNeeded?: boolean;
  onRefreshClear?: () => void;
  surveyStatus?: "checking" | "show" | "hide"; // Add surveyStatus prop
}

const PAGE_SIZE = 9;
const SLIDER_THRESHOLD = 5; // If more than 5 properties, use slider on mobile

export default function PropertyGrid({
  onPropertyDetailsAction,
  onAvailabilityAction,
  onAddNewPropertyAction,
  onRefreshNeeded,
  refreshNeeded = false,
  onRefreshClear,
  surveyStatus // Add surveyStatus
}: PropertyGridProps) {
  const { properties, loading, refreshProperties } = useProperties();
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const { toast } = useToast();
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Slider state
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  // Handler for improved refresh button (clear cache, then refresh)
  const handleRefresh = useCallback(async () => {
    PropertyCache.clearCache();
    setTimeout(async () => {
      await refreshProperties();
      if (onRefreshClear) onRefreshClear();
      toast({
        title: "Properties refreshed",
        description: "Your property list has been updated.",
      });
    }, 200);
  }, [refreshProperties, onRefreshClear, toast]);

  // Memoized delete handler
  const handleDeleteProperty = useCallback(async (propertyId: string) => {
    try {
      setDeletingPropertyId(propertyId);
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);
      if (error) {
        toast({
          title: "Delete failed",
          description: `Error: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      PropertyCache.invalidatePropertyCache(propertyId);
      PropertyCache.setProperties([], undefined);
      toast({
        title: "Property deleted",
        description: "The property has been successfully deleted",
        variant: "default"
      });
      refreshProperties();
    } catch {
      toast({
        title: "Delete failed",
        description: "Unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingPropertyId(null);
    }
  }, [refreshProperties, toast]);

  // Memoized notification click handler
  const handleNotificationClick = useCallback((property: Property) => {
    setSelectedProperty(property);
    setNotificationModalOpen(true);
  }, []);

  const handleAvailabilityAction = useCallback((property: Property) => {
    onAvailabilityAction(property);
  }, [onAvailabilityAction]);

  useEffect(() => {
    if (onRefreshNeeded) {
      onRefreshNeeded(refreshProperties);
    }
    // Listen for custom event to trigger Add New Property
    const handleTriggerAdd = () => {
      if (surveyStatus === "hide") {
        onAddNewPropertyAction();
      }
    };
    window.addEventListener("triggerAddNewProperty", handleTriggerAdd);
    return () => {
      window.removeEventListener("triggerAddNewProperty", handleTriggerAdd);
    };
  }, [onRefreshNeeded, refreshProperties, onAddNewPropertyAction, surveyStatus]);

  // Slider scroll logic for mobile
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const handleScrollEvent = () => {
      setScrollPosition(container.scrollLeft);
      setMaxScroll(container.scrollWidth - container.clientWidth);
    };
    handleScrollEvent();
    container.addEventListener('scroll', handleScrollEvent);
    window.addEventListener('resize', handleScrollEvent);
    return () => {
      container.removeEventListener('scroll', handleScrollEvent);
      window.removeEventListener('resize', handleScrollEvent);
    };
  }, [properties?.length, visibleCount]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollAmount = direction === 'left' ? -320 : 320;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Determine if slider should be used (mobile, > threshold)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const useSlider = Array.isArray(properties) && properties.length > SLIDER_THRESHOLD;

  // Categorize properties
  const availableProperties = Array.isArray(properties)
    ? properties.filter((p) => p.available)
    : [];
  const rentedProperties = Array.isArray(properties)
    ? properties.filter((p) => !p.available)
    : [];

  // Helper for slider row
  const renderSliderRow = (
    title: string,
    propertyList: Property[],
    emptyText: string
  ) => (
    <div className="mb-12">
      <h3 className="font-bold text-white text-lg md:text-xl mb-4">{title}</h3>
      {propertyList.length > 0 ? (
        <div className="relative">
          <div
            ref={containerRef}
            className="flex gap-5 overflow-x-auto hide-scrollbar pb-6 snap-x snap-mandatory justify-start"
            style={{ scrollBehavior: 'smooth' }}
          >
            {propertyList.slice(0, visibleCount).map((property, index) => (
              <div
                key={property.id}
                className={`min-w-[280px] md:min-w-[320px] max-w-xs md:max-w-sm snap-start ${
                  deletingPropertyId === property.id ? 'opacity-50 pointer-events-none' : ''
                } opacity-0 animate-fade-in-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <PropertyCard
                  property={property}
                  onDetailsAction={() => onPropertyDetailsAction(property)}
                  onAvailabilityAction={() => handleAvailabilityAction(property)}
                  onNotificationsAction={handleNotificationClick}
                  onDeleteAction={handleDeleteProperty}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full py-8 text-center text-white/60">{emptyText}</div>
      )}
    </div>
  );

  return (
    <section className="py-16 md:py-24 bg-black relative overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 relative z-10">
        <div className="opacity-0 translate-y-5 animate-fade-in-up">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4 opacity-0 translate-y-2 animate-fade-in-up">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <Home className="w-4 h-4 text-black" />
                </div>
                <span className="text-white/70 text-sm font-medium">Your Property Portfolio</span>
              </div>
              <h2 className="font-bold mb-4 text-white text-fluid-h2 opacity-0 translate-y-2 animate-fade-in-up animation-delay-100">
                Manage Your Properties
              </h2>
              <p className="text-base md:text-lg text-white/70 opacity-0 translate-y-2 animate-fade-in-up animation-delay-200">
                View and manage all your properties in one place with real-time information
              </p>
            </div>
            {/* Improved Refresh Button */}
            <div className="mt-6 md:mt-0">
              <button
                onClick={handleRefresh}
                className={
                  `px-4 py-2 text-sm rounded-full transition-all duration-300 flex items-center gap-2
                  bg-white/10 text-white/70 hover:bg-white/20
                  ${refreshNeeded ? "shadow-[0_0_16px_4px_rgba(34,197,94,0.5)] ring-2 ring-green-400/80 animate-glow" : ""}`
                }
                style={{
                  position: "relative",
                  outline: refreshNeeded ? "2px solid #22c55e" : undefined,
                }}
                title={refreshNeeded ? "New property added or updated. Click to refresh your list." : "Refresh property list"}
              >
                <span className="relative flex items-center">
                  <RefreshCw
                    className={`w-4 h-4 transition-transform duration-500
                      ${refreshNeeded ? "animate-spin-slow text-green-400" : ""}
                    `}
                  />
                </span>
                <span className={refreshNeeded ? "text-green-400 font-semibold" : ""}>
                  Refresh
                </span>
                {refreshNeeded && (
                  <span className="ml-2 text-xs text-green-400 animate-pulse">
                    New changes!
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* --- SLIDER MODE (if many properties) --- */}
          {Array.isArray(properties) && properties.length > SLIDER_THRESHOLD ? (
            <>
              {renderSliderRow(
                "My Available Properties",
                availableProperties,
                "No available properties"
              )}
              {renderSliderRow(
                "Rented Properties",
                rentedProperties,
                "No rented properties"
              )}
              <div className="mb-12">
                <h3 className="font-bold text-white text-lg md:text-xl mb-4">Add New Property</h3>
                <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-6 snap-x snap-mandatory justify-start">
                  <div className="min-w-[280px] md:min-w-[320px] max-w-xs md:max-w-sm snap-start opacity-0 animate-fade-in-up animation-delay-300">
                    <button
                      data-add-property-btn
                      onClick={onAddNewPropertyAction}
                      disabled={surveyStatus !== "hide"}
                      className={`flex flex-col items-center justify-center w-full h-full py-14 px-6 text-white/80 hover:text-white transition-all group border-dashed border-2 border-white/30 rounded-xl bg-white/5 backdrop-blur-sm
                        ${surveyStatus !== "hide" ? "opacity-60 cursor-not-allowed" : ""}`}
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
              {/* Load More button centered on slider */}
              {visibleCount < properties.length && (
                <div className="flex justify-center w-full mt-6">
                  <button
                    onClick={() => setVisibleCount(c => Math.min(c + PAGE_SIZE, properties.length))}
                    className="px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          ) : (
            // --- GRID MODE (few properties) ---
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-3 flex flex-col items-center justify-center py-20 space-y-4 opacity-0 animate-fade-in">
                  <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <p className="text-white/70">Loading properties...</p>
                </div>
              ) : Array.isArray(properties) && properties.length > 0 ? (
                <>
                  {properties.slice(0, visibleCount).map((property, index) => (
                    <div
                      key={property.id}
                      className={`mx-auto w-full max-w-xs md:max-w-sm transform transition-all duration-300 hover:-translate-y-2.5 opacity-0 animate-fade-in-up ${
                        deletingPropertyId === property.id ? 'opacity-50 pointer-events-none' : ''
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <PropertyCard
                        property={property}
                        onDetailsAction={() => onPropertyDetailsAction(property)}
                        onAvailabilityAction={() => handleAvailabilityAction(property)}
                        onNotificationsAction={handleNotificationClick}
                        onDeleteAction={handleDeleteProperty}
                      />
                    </div>
                  ))}
                  {/* Add New Property Card */}
                  <div className="w-full max-w-xs md:max-w-sm opacity-0 animate-fade-in-up animation-delay-300">
                    <button
                      data-add-property-btn
                      onClick={onAddNewPropertyAction}
                      disabled={surveyStatus !== "hide"}
                      className={`flex flex-col items-center justify-center w-full h-full py-14 px-6 text-white/80 hover:text-white transition-all group border-dashed border-2 border-white/30 rounded-xl bg-white/5 backdrop-blur-sm
                        ${surveyStatus !== "hide" ? "opacity-60 cursor-not-allowed" : ""}`}
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
                  {/* Load More button centered */}
                  {visibleCount < properties.length && (
                    <div className="col-span-full flex justify-center w-full mt-6">
                      <button
                        onClick={() => setVisibleCount(c => Math.min(c + PAGE_SIZE, properties.length))}
                        className="px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-white col-span-full text-center py-12 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 opacity-0 animate-fade-in">
                    No properties found
                  </p>
                  {/* Always show Add New Property Card even if no properties */}
                  <div className="w-full max-w-xs md:max-w-sm opacity-0 animate-fade-in-up animation-delay-300 mx-auto mt-8">
                    <button
                      data-add-property-btn
                      onClick={onAddNewPropertyAction}
                      disabled={surveyStatus !== "hide"}
                      className={`flex flex-col items-center justify-center w-full h-full py-14 px-6 text-white/80 hover:text-white transition-all group border-dashed border-2 border-white/30 rounded-xl bg-white/5 backdrop-blur-sm
                        ${surveyStatus !== "hide" ? "opacity-60 cursor-not-allowed" : ""}`}
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
                </>
              )}
            </div>
          )}
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
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
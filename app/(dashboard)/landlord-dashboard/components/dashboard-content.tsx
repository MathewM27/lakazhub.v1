"use client";

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PropertyGrid from './property-component/property-grid';
import HeroSection from "../layout/hero-section";
import { Footer } from "../navigation/footer";
import { Property } from "../types";
import { PropertyCache } from "../lib/utils/cache/propertyCache";


// Dynamically import heavy/rarely-used components at the top-level
const OtherProperties = dynamic(() => import("../layout/other-properties"), {
  loading: () => <div className="text-white/70 py-12 text-center">Loading analytics...</div>,
  ssr: false,
});
const CacheMonitor = dynamic(() => import("./cache-monitor"), {
  loading: () => <div className="text-white/70 py-12 text-center">Loading cache monitor...</div>,
  ssr: false,
});

interface DashboardContentProps {
  onPropertyDetailsAction: (property: Property) => void;
  onAvailabilityAction: (property: Property) => void;
  onAddNewPropertyAction: () => void;
  onRefreshNeeded?: (refreshFunction: () => Promise<Property[] | void>) => void;
}

export function DashboardContent({
  onPropertyDetailsAction,
  onAvailabilityAction,
  onAddNewPropertyAction,
  onRefreshNeeded
}: DashboardContentProps) {
  const [refreshFunction, setRefreshFunction] = useState<() => Promise<Property[] | void>>();
  const [refreshNeeded, setRefreshNeeded] = useState(false);

  const handleRefreshNeeded = useCallback((refreshFn: () => Promise<Property[] | void>) => {
    setRefreshFunction(() => refreshFn);
    if (onRefreshNeeded) {
      onRefreshNeeded(refreshFn);
    }
  }, [onRefreshNeeded]);

  // Listen for propertyChanged event to show the refresh indicator
  useEffect(() => {
    const handler = () => setRefreshNeeded(true);
    window.addEventListener("propertyChanged", handler);
    return () => window.removeEventListener("propertyChanged", handler);
  }, []);

  // Handler to be called after property add/update
  const handlePropertyChanged = useCallback(() => {
    setRefreshNeeded(true);
  }, []);

  // Handler for refresh button (not used here, but kept for completeness)
  const handleRefresh = useCallback(async () => {
    PropertyCache.clearCache();
    setTimeout(async () => {
      if (refreshFunction) {
        await refreshFunction();
        setRefreshNeeded(false);
      }
    }, 200);
  }, [refreshFunction]);

  return (
    <div className="flex-1">
      <HeroSection />
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">My Properties</h2>
        <PropertyGrid
          onPropertyDetailsAction={onPropertyDetailsAction}
          onAvailabilityAction={onAvailabilityAction}
          onAddNewPropertyAction={onAddNewPropertyAction}
          onRefreshNeeded={handleRefreshNeeded}
          refreshNeeded={refreshNeeded}
          onRefreshClear={() => setRefreshNeeded(false)}
        />
      </section>
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Coming Soon</h2>
        <OtherProperties />
      </section>
      <CacheMonitor />
      <Footer />
    </div>
  );
}

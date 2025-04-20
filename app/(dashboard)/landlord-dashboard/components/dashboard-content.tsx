"use client";

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PropertyGrid from './property-component/property-grid';
import HeroSection from "../layout/hero-section";
import { Footer } from "../navigation/footer";
import { Property } from "../types";
import CacheMonitor from './cache-monitor';

// Dynamically import OtherProperties for performance
const OtherProperties = dynamic(() => import("../layout/other-properties"), {
  loading: () => <div className="text-white/70 py-12 text-center">Loading analytics...</div>,
  ssr: false,
});

interface DashboardContentProps {
  onPropertyDetailsAction: (property: Property) => void;
  onAvailabilityAction: (property: Property) => void;
  onAddNewPropertyAction: () => void;
  onRefreshNeeded?: (refreshFunction: () => Promise<Property[] | void>) => void; // Added this prop to match what's being passed
}

export function DashboardContent({
  onPropertyDetailsAction,
  onAvailabilityAction,
  onAddNewPropertyAction,
  onRefreshNeeded
}: DashboardContentProps) {
  const [refreshFunction, setRefreshFunction] = useState<() => Promise<Property[] | void>>();
  
  const handleRefreshNeeded = useCallback((refreshFn: () => Promise<Property[] | void>) => {
    setRefreshFunction(() => refreshFn);
    // Call the parent component's onRefreshNeeded function if provided
    if (onRefreshNeeded) {
      onRefreshNeeded(refreshFn);
    }
  }, [onRefreshNeeded]);

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

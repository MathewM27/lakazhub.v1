"use client";

import React, { useState, useCallback, useEffect } from 'react';
import PropertyGrid from './property-component/property-grid';
import { Footer } from "../navigation/footer";
import { Property } from "../types";

interface DashboardContentProps {
  onPropertyDetailsAction: (property: Property) => void;
  onAvailabilityAction: (property: Property) => void;
  onAddNewPropertyAction: () => void;
  onRefreshNeeded?: (refreshFunction: () => Promise<Property[] | void>) => void;
  surveyStatus?: "checking" | "show" | "hide"; // Add surveyStatus prop
}

export function DashboardContent({
  onPropertyDetailsAction,
  onAvailabilityAction,
  onAddNewPropertyAction,
  onRefreshNeeded,
  surveyStatus // Add surveyStatus
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

  return (
    <div className="flex-1 pt-8">
      <section className="mx-auto px-4 py-8">
        <PropertyGrid
          onPropertyDetailsAction={onPropertyDetailsAction}
          onAvailabilityAction={onAvailabilityAction}
          onAddNewPropertyAction={onAddNewPropertyAction}
          onRefreshNeeded={handleRefreshNeeded}
          refreshNeeded={refreshNeeded}
          onRefreshClear={() => setRefreshNeeded(false)}
          surveyStatus={surveyStatus} // Pass surveyStatus to PropertyGrid
        />
      </section>
      <Footer />
    </div>
  );
}

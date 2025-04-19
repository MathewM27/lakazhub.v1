"use client";

import dynamic from 'next/dynamic';
import PropertyGrid from './property-component/property-grid';
import HeroSection from "../layout/hero-section";
import { Footer } from "../navigation/footer";
import { Property } from "../types";

// Dynamically import OtherProperties for performance
const OtherProperties = dynamic(() => import("../layout/other-properties"), {
  loading: () => <div className="text-white/70 py-12 text-center">Loading analytics...</div>,
  ssr: false,
});

interface DashboardContentProps {
  onPropertyDetailsAction: (property: Property) => void;
  onAvailabilityAction: (property: Property) => void;
  onAddNewPropertyAction: () => void;
}

export function DashboardContent({
  onPropertyDetailsAction,
  onAvailabilityAction,
  onAddNewPropertyAction,
}: DashboardContentProps) {
  return (
    <div className="flex-1">
      <HeroSection />
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">My Properties</h2>
        <PropertyGrid
          onPropertyDetailsAction={onPropertyDetailsAction}
          onAvailabilityAction={onAvailabilityAction}
          onAddNewPropertyAction={onAddNewPropertyAction}
        />
      </section>
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Coming Soon</h2>
        <OtherProperties />
      </section>
      <Footer />
    </div>
  );
}

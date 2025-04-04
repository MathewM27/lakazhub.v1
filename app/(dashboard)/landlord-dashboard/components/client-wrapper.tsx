"use client";

import dynamic from "next/dynamic";

// Use dynamic import to ensure client-side rendering for authentication
const DynamicLandlordDashboard = dynamic(
  () => import('./landlord-dashboard'),
  { ssr: false }
);

export default function ClientWrapper() {
  return <DynamicLandlordDashboard />;
}
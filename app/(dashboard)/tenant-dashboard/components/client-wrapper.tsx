"use client";

import dynamic from "next/dynamic";

// Use dynamic import to ensure client-side rendering for authentication
const DynamicTenantDashboard = dynamic(
  () => import('./tenant-dashboard'),
  { ssr: false }
);

export default function ClientWrapper() {
  return <DynamicTenantDashboard />;
}
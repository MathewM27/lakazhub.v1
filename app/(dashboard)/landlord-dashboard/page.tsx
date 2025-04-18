import type { Metadata } from "next"

import LandlordDashboard from "./components/landlord-dashboard"

export const metadata: Metadata = {
  title: "LakazHub - Landlord Dashboard",
  description: "Manage your rental properties efficiently with LakazHub",
}

export default function LandlordDashboardPage() {
  return <LandlordDashboard />; 
}


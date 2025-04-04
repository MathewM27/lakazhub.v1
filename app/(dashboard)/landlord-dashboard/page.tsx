import type { Metadata } from "next"
import LandlordDashboard from "./components/landlord-dashboard"
import dynamic from "next/dynamic"

export const metadata: Metadata = {
  title: "LakazHub - Landlord Dashboard",
  description: "Manage your rental properties efficiently with LakazHub",
}

// Use dynamic import to ensure client-side rendering for authentication
const DynamicLandlordDashboard = dynamic(
  () => import('./components/landlord-dashboard'),
  { ssr: false }
)

export default function LandlordPage() {
  return (
    <main className="min-h-screen bg-background">
      <DynamicLandlordDashboard />
    </main>
  )
}


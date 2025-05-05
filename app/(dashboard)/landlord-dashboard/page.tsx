import type { Metadata } from "next"

import LandlordDashboard from "./components/landlord-dashboard"
import IosInstallPrompt from "@/components/pwa/IosInstallPrompt";

export const metadata: Metadata = {
  title: "LakazHub - Landlord Dashboard",
  description: "Manage your rental properties efficiently with LakazHub",
}

export default function LandlordDashboardPage() {
  return (
    <>
      <IosInstallPrompt />
      <LandlordDashboard />
    </>
  );
}

